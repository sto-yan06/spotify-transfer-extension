// Listener for the login button
document.getElementById('login').addEventListener('click', function()
{
    chrome.runtime.sendMessage({ action: 'login' });
});

//Listener for diplaying the list
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => 
    {
    if (message.action === 'showSongs') 
        {
        document.getElementById('content').style.display = 'block';
        document.getElementById('login').style.display = 'none';
        const songList = document.getElementById('songList');
        songList.innerHTML = ''; // Clear existing options

        message.songs.forEach(song => 
            {
            const li = document.createElement('li');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = song.id;

            const span = document.createElement('span'); // Create a span for the track name
            span.className = 'track-name'; // Add track-name class
            span.textContent = `${song.name} by ${song.artist}`; // Set the text content

            li.appendChild(checkbox); // Add checkbox to the list item
            li.appendChild(span); // Add track name to the list item
            songList.appendChild(li); // Add list item to the song list
        });
    }
});

// Listener for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => 
    {
    if (message.action === 'showPlaylists') 
        {
        const playlistSelect = document.getElementById('playlistSelect');
        
        playlistSelect.innerHTML = ''; // Clear existing options

        message.playlists.forEach(playlist => 
            {
            const option = document.createElement('option');
            option.value = playlist.id; // Set option value to the Playlist ID
            option.textContent = playlist.name; // Display Playlist name
            playlistSelect.appendChild(option); // Add to dropdown
        });
    }
});

// Add event listener for "Select All" button
document.getElementById('selectAll').addEventListener('click', function() 
{
    const checkboxes = document.querySelectorAll('#songList input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
    
    checkboxes.forEach(checkbox => 
        {
        checkbox.checked = !allChecked; // Toggle checkbox state
    });
});

// Listener for transferring songs to the selected playlist
document.getElementById('transfer').addEventListener('click', function() 
{
    const selectedSongs = Array.from(document.querySelectorAll('#songList input:checked'))
                                .map(input => input.value);
    const playlist = document.getElementById('playlistSelect').value;
    const newPlaylistName = document.getElementById('newPlaylistName').value;

    chrome.runtime.sendMessage({
        action: 'transferSongs',
        songs: selectedSongs,
        playlist,
        newPlaylistName
    });
});