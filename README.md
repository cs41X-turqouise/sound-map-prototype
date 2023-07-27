# Sound Map for a Changing Landscape
...fill out

# Getting Started
To get started, clone this repository to your local machine and install the dependencies:
```
git clone https://github.com/cs41X-turqouise/sound-map-prototype.git
cd sound-map-prototype
npm install
```

Next, create a .env file in the root directory of the project and add the following environment variables:
```
PORT=3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DEV_BASE_URL=http://localhost:3000
```

Replace your-google-client-id and your-google-client-secret with your own Google OAuth 2.0 client ID and client secret.

Finally, start the server:
```
npm start
```
or for developing use
```
npm run dev
```

The server should now be running at http://localhost:3000.

# Usage
To use the application, navigate to http://localhost:3000 in your web browser. Click the "Login with Google" button to log in with your Google account. After logging in, you should see a personalized greeting message with your email address.
<br>

<!-- ![Temp-Home-Page](image.png) -->

# License
...todo
<!-- This project is licensed under the MIT License - see the LICENSE file for details. -->