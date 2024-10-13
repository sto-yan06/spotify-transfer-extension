# Spotify Playlist Transfer

#### Description
Transform your "Liked Songs" playlist in Spotify into a new standalone, identical playlist with ease. This Chrome Web Extension allows users to manage their Spotify playlists more effectively by enabling them to transfer their liked songs into a new or existing playlist.

## Features

- **Transfer Liked Songs**: Easily transfer your entire "Liked Songs" collection to a new playlist.
- **Select Songs**: Choose specific songs you want to transfer rather than transferring the entire collection.
- **Create New Playlist**: Input a name for a new playlist that will contain the transferred songs.
- **Add to Existing Playlist**: Select from your existing playlists to add your chosen songs.
- **User-Friendly Interface**: An intuitive popup interface that simplifies the process of playlist management.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Folder Structure](#folder-structure)
5. [Requirements](#requirements)
6. [Limitations](#limitations)
7. [License](#license)

## Getting Started

To get started with the Spotify Playlist Transfer extension, follow the installation instructions below. Ensure that you are using the Google Chrome browser, as this extension is specifically designed for it.

## Installation

1. **Open Chrome Extensions Page**: Navigate to the Chrome Extensions page by typing `chrome://extensions/` in the address bar.

2. **Enable Developer Mode**: Toggle the "Developer mode" switch in the upper right corner of the Extensions page.

3. **Load Unpacked Extension**: Click on "Load unpacked" and select the folder where you downloaded or cloned the project files.

4. **Check Extension Status**: The extension should now appear in your list of installed extensions. Ensure it is enabled.

## Usage

Once the extension is installed, follow these steps to transfer your liked songs:

1. **Log In to Spotify**: Ensure you are logged into your Spotify account. The extension requires authentication to access your playlists.

2. **Select Songs**: In the extension popup, you can either select all of your liked songs or just the specific ones you wish to transfer.

3. **Choose Playlist Options**:
   - If you want to create a new playlist, type the desired name in the provided text box.
   - If you wish to add songs to an existing playlist, make sure the text box is left empty.

4. **Transfer Songs**: Click on the "Transfer" button to initiate the process. If you opted to create a new playlist, the extension will create it for you and transfer the selected songs.

## Important Note

**BE CAREFUL!** If you want to add songs to an already existing playlist, the text box must remain **EMPTY**. If there is any text entered, the extension will attempt to create a new playlist instead, which may lead to unintended results.

## Folder Structure

- **assets/**: This directory contains additional assets used in the extension.
- **manifest.json**: The metadata file for the extension, including permissions and configurations.
- **oauth.js**: Handles the OAuth authentication process with Spotify.
- **background.js**: The background script that manages the extension's logic and state.
- **popup.js**: The script for the popup interface that interacts with the user.
- **popup.html**: The HTML file that defines the layout of the extension's popup.
- **styles.css**: The CSS file that styles the popup interface.

## Requirements

- **Google Chrome**: This extension is designed to work with the Google Chrome browser.
- **Spotify Account**: You need a Spotify account to use this extension.

## Limitations

- The extension currently only transfers songs from the "Liked Songs" playlist.
- Users must be logged in to their Spotify account for the extension to function correctly.
- The transfer process may take some time depending on the number of songs selected.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.