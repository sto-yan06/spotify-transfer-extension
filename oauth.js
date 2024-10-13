// Spotify OAuth details
const clientId = 'bb4af864adc84d7b955d70be0577a8ee';
const scopes = ['user-library-read', 'playlist-modify-public', 'playlist-modify-private', 'playlist-read-private'];

// Function to build the Spotify Authentication URL
export function getSpotifyAuthUrl() {
    const redirectUri = chrome.identity.getRedirectURL();
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'token'); // Ensure response_type is set to 'token'
    authUrl.searchParams.set('redirect_uri', redirectUri); // Use the redirect URI from above
    authUrl.searchParams.set('scope', scopes.join(' ')); // Include required scopes
    return authUrl.toString();
}

// Function to extract access token from the redirect URL
export function extractAccessToken(redirectUrl)
{
    const url = new URL(redirectUrl);
    const hash = new URLSearchParams(url.hash.substring(1));
    return hash.get('access_token');
}

// Function to check if the access tocken is valid or expired
function isTokenExpired(token)
{
    // Spotify Token expires after 1 hour (3600 seconds)
    // Store expiration time during token retrieval
    const expirationTime = Date.now() + 3600 * 1000; // 1 hour from the moment
    chrome.storage.sync.set({tokenExpiration: expirationTime});
    return Date.now() >= expirationTime;
}

// Function to refresh token (if needed)
// Spotify's OAuth2 token flow does not support refresh tokens with Implicit Grant
function refreshToken()
{
    chrome.storage.sync.get(['token', 'tokenExpiration'], function(data)
{
    if(!data.token || isTokenExpired(data.token)) // Check if token expired
    {
        initateSpotifyLogin(); // Re-initiate login if token expired
    }
});
}

// Function to save token details
function saveToken(token)
{
    const expirationTime = Date.now() + 3600 * 1000; // 1 Hour from the moment
    chrome.storage.sync.set({
        token, 
        tokenExpiration : expirationTime
    }, function(){
        console.log('Token saved successfully!');
    });
}

// Function to launch Spotify login (initiated by background.js)
export function initiateSpotifyLogin() {
    const authUrl = getSpotifyAuthUrl(); // Build the authorization URL with required scopes
    chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
    }, function(redirectUrl) {
        if (redirectUrl) {
            const token = extractAccessToken(redirectUrl); // Extract token from redirect URL
            if (token) {
                saveToken(token); // Save token and expiration time
            }
        }
    });
}