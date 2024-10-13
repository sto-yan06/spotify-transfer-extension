import { extractAccessToken, getSpotifyAuthUrl } from './oauth.js';

// Listener for messages from popup.js or other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'login') {
        initateSpotifyLogin(); // Start the Spotify login (OAuth2) flow when the user clicks 'Login'
    } else if (message.action === 'transferSongs') {
        chrome.storage.sync.get('token', function(data) {
            transferSongs(data.token, message.songs, message.playlist, message.newPlaylistName);
        });
    }
});

async function validateToken(token) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        // If response status is 200, the token is valid
        return response.ok; 
    } catch (err) {
        console.error('Error validating token: ', err);
        return false; // Consider token invalid if there was an error
    }
}

async function initateSpotifyLogin() {
    chrome.storage.sync.get('token', async (data) => {
        if (data.token) {
            // Validate token before proceeding
            const isValid = await validateToken(data.token);
            if (isValid) {
                console.log("Token is valid, fetching liked songs and playlists...");
                fetchLikedSongs(data.token); // Fetch liked songs
                fetchUserPlaylist(data.token); // Fetch user's playlists
            } else {
                console.log("Token is invalid or expired, re-authenticating...");
                startSpotifyAuthFlow();
            }
        } else {
            startSpotifyAuthFlow(); // No token, start authentication
        }
    });
}

function startSpotifyAuthFlow() {
    const authURL = getSpotifyAuthUrl(); // Build the authorization URL 
    chrome.identity.launchWebAuthFlow(
        {
            url: authURL,
            interactive: true // Make the login Interactive
        }, function(redirectUrl) {
            if (chrome.runtime.lastError) {
                console.error("Error during auth:", JSON.stringify(chrome.runtime.lastError));
                return;
            }
            if (redirectUrl) {
                const token = extractAccessToken(redirectUrl); // Extract token from redirect URL
                if (token) {
                    chrome.storage.sync.set({ token }, function() {
                        fetchLikedSongs(token); // Fetch liked songs
                        fetchUserPlaylist(token); // Fetch user's playlists
                    });
                }
            }
        });
}

// Function to fetch data from the 'liked songs' playlist
function fetchLikedSongs(token) 
{
    const limit = 50; // Number of items per request
    let offset = 0; // Offset for pagination
    let songs = []; // Array to hold all songs

    const fetchSongsPage = () => {
        const apiUrl = `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`;

        if (!token) {
            console.error("No token provided. Cannot fetch songs.");
            return;
        }

        // Fetch the liked songs from the endpoint
        fetch(apiUrl, {
            headers: {
                'Authorization': 'Bearer ' + token.trim() // Ensure that there are no extra spaces
            }
        }).then(response => {
            if (!response.ok) {
                // Log the response status and statusText
                console.error(`Error fetching songs: ${response.status} ${response.statusText}`);
                return response.json().then(err => {
                    throw new Error(`API error: ${err.error.message}`); // Status code for the fetching playlists
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("API Response: ", data);

            // Check if 'items' is defined
            if (!data.items) {
                console.error("No items found in the response.");
                return;
            }

            // Map and add new songs to the array
            const newSongs = data.items.map(item => ({
                id: item.track.id,
                name: item.track.name,
                artist: item.track.artists[0].name
            }));
            songs = songs.concat(newSongs); // Combine the new songs with existing ones

            // Update offset for the next page
            offset += limit;

            // If there's a next page, fetch it
            if (data.next) {
                fetchSongsPage(); // Fetch the next page
            } else {
                // All pages fetched, send all songs to the popup
                chrome.runtime.sendMessage({ action: 'showSongs', songs });
            }
        }).catch(err => {
            console.error('Error fetching songs: ', err);
        });
    };

    fetchSongsPage(); // Start fetching the first page
}

// Function to transfer songs into an existing/new playlist
function transferSongs(token, songs, playlistId, newPlaylistName) 
{
    if(newPlaylistName)
    {
        // If user opted to create a new playlist for the liked songs
        createNewPlaylist(token, newPlaylistName).then(newPlaylistId =>{
            addSongsToPlaylist(token, newPlaylistId, songs);
        });
    } else
    {
        addSongsToPlaylist(token, playlistId, songs);
    }
}

// Helper function to create a new playlist
function createNewPlaylist(token, name)
{
    const userIdUrl = 'https://api.spotify.com/v1/me'; // Get user id

    //Create a new playlist with the specific api
    return fetch(userIdUrl, {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(response => response.json())
    .then(user => {
        const createPlaylistUrl = `https://api.spotify.com/v1/users/${user.id}/playlists`;
        return fetch(createPlaylistUrl, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({name, public: false})
        }).then(respone => respone.json())
        .then(newPlaylist => newPlaylist.id);
    });
}

//Helper function to add songs to an existing or new playlist
function addSongsToPlaylist(token, playlistId, songs) {
    const trackUris = songs.map(songId => `spotify:track:${songId}`); // Map the URI of the current song
    const addTracksUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`; // Get the track's URL

    // Function to fetch the existing tracks in the playlist
    const fetchExistingTracks = () => {
        let existingTracks = [];
        let apiUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`; // Get the first 100 tracks

        const fetchTracksPage = () => {
            fetch(apiUrl, {
                headers: {
                    'Authorization': 'Bearer ' + token,
                },
            })
            .then(response => {
                if (!response.ok) {
                    console.error(`Error fetching existing tracks: ${response.status} ${response.statusText}`);
                    return response.json().then(err => {
                        console.error("Error details:", err);
                        throw new Error(`API error: ${err.error.message}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                existingTracks = existingTracks.concat(data.items.map(item => item.track.id)); // Collect track IDs

                // If there's a next page, fetch it
                if (data.next) {
                    apiUrl = data.next; // Set apiUrl to the next page URL
                    fetchTracksPage(); // Fetch the next page
                } else {
                    // After fetching all existing tracks, proceed to add new tracks
                    const uniqueTracks = trackUris.filter(uri => !existingTracks.includes(uri.split(':')[2])); // Filter out existing tracks
                    if (uniqueTracks.length > 0) {
                        addTracksToPlaylistInChunks(uniqueTracks); // Add only unique tracks
                    } else {
                        console.log("No new unique tracks to add.");
                        chrome.runtime.sendMessage({
                            action: 'transferComplete'
                        });
                    }
                }
            })
            .catch(err => {
                console.error('Error fetching existing tracks: ', err);
            });
        };

        fetchTracksPage(); // Start fetching the first page of existing tracks
    };

    // Function to add tracks in chunks to the playlist
    const addTracksToPlaylistInChunks = (uniqueTracks) => {
        const chunkSize = 100; // Spotify API limit
        const chunks = [];

        // Break the unique tracks into chunks of 100
        for (let i = 0; i < uniqueTracks.length; i += chunkSize) {
            chunks.push(uniqueTracks.slice(i, i + chunkSize));
        }

        // Function to add tracks in chunks
        const addTracksInChunks = (chunkIndex) => {
            if (chunkIndex >= chunks.length) {
                console.log("All unique songs transferred successfully!");
                chrome.runtime.sendMessage({
                    action: 'transferComplete'
                });
                return;
            }

            // Fetching the data as a POST request and add it to the existing/new playlist
            fetch(addTracksUrl, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ uris: chunks[chunkIndex] })
            })
            .then(response => {
                if (response.ok) {
                    console.log(`Chunk ${chunkIndex + 1} of unique tracks transferred successfully!`);
                    addTracksInChunks(chunkIndex + 1); // Transfer the next chunk
                } else {
                    // Log the status and error message
                    return response.json().then(err => {
                        console.error('Error transferring unique songs: ', response.status, response.statusText, err.error.message);
                    });
                }
            })
            .catch(err => {
                console.error('Network error transferring unique songs: ', err);
            });
        };

        // Start transferring the first chunk of unique tracks
        addTracksInChunks(0);
    };

    // Start the process by fetching existing tracks
    fetchExistingTracks();
}

// Function to get all the user's playlists:
function fetchUserPlaylist(token) {
    let playlists = [];
    let apiUrl = 'https://api.spotify.com/v1/me/playlists?limit=50';

    const fetchPlaylists = () => {
        fetch(apiUrl, {
            headers: {
                'Authorization': 'Bearer ' + token.trim()
            }
        })
        .then(response => {
            if (!response.ok) {
                console.error(`Error fetching playlists: ${response.status} ${response.statusText}`);
                return response.json().then(err => {
                    console.error("Error details:", err);
                    throw new Error(`API error: ${err.error.message}`);
                });
            }
            return response.json();
        })
        .then(data => {
            playlists = playlists.concat(data.items); // Combine the playlists from this response

            // If there's a next page, fetch it
            if (data.next) {
                apiUrl = data.next; // Set apiUrl to the next page URL
                fetchPlaylists(); // Fetch the next page
            } else {
                // No more pages, send all playlists to the popup
                chrome.runtime.sendMessage({ action: 'showPlaylists', playlists: playlists.map(item => ({
                    id: item.id,
                    name: item.name
                })) }); // Send all fetched playlists
            }
        })
        .catch(err => {
            console.error('Error fetching playlists: ', err);
        });
    };

    fetchPlaylists(); // Start fetching
}