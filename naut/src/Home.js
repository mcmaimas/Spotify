import React, { useEffect } from "react";
import queryString from "query-string";
import axios from "axios";
import request from "request";

function Home(props) {
  const [accessToken, setAccessToken] = React.useState("");
  const [refreshToken, setRefreshToken] = React.useState("");
  const [userInfo, setUserInfo] = React.useState({});
  const queryParams = queryString.parse(props.location.search);
  const [artist, setArtist] = React.useState("");
  const [artistId, setArtistId] = React.useState("");
  const [headers, setHeaders] = React.useState({});
  const [playListInfo, setPlaylistInfo] = React.useState();
  const baseSpotifyURL = "https://api.spotify.com/v1";
  const client_id = "eea78311208a43669014d1615bf68cf2"; // Your client id
  const client_secret = ""; // Your secret

  const getRelatedArtists = (rootArtistId) => {
    const url = `${baseSpotifyURL}/artists/${rootArtistId}/related-artists`;
    axios
      .get(url, { headers })
      .then((res) => {
        const userCountry = userInfo.country;
        axios
          .all(
            res.data.artists.map((relatedArtist) =>
              axios.get(
                `${baseSpotifyURL}/artists/${relatedArtist.id}/top-tracks?country=${userCountry}`,
                { headers }
              )
            )
          )
          .then((responseArr) => {
            setPlaylistInfo(responseArr);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getArtistInfo = () => {
    const artistString = encodeURIComponent(artist.trim());
    const url = `${baseSpotifyURL}/search?q=${artistString}&type=artist`;
    axios
      .get(url, { headers })
      .then((res) => {
        getRelatedArtists(res.data.artists.items[0].id);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    setArtistId("0OdUWJ0sBjDrqHygGUXeCF");
    const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: queryParams.code,
        redirect_uri: "http://localhost:3000/",
        grant_type: "authorization_code",
      },
      headers: {
        Authorization:
          "Basic " +
          new Buffer(client_id + ":" + client_secret).toString("base64"),
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        setAccessToken(body.access_token);
        setHeaders({ Authorization: `Bearer ${body.access_token}` });
        setRefreshToken(body.refresh_token);
        const options = {
          url: "https://api.spotify.com/v1/me",
          headers: { Authorization: "Bearer " + body.access_token },
          json: true,
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (error, response, body) {
          setUserInfo(body);
        });
      }
    });
  }, []);
  //   🚀

  const createPlaylist = () => {
    const tracks = playListInfo.map((related) => {
      return `spotify:track:${related.data.tracks[0].id}`;
    });
    console.log(tracks);
    const playlistData = {
      name: `🚀 - ${artist}`,
      description: `${artist}: Related artist`,
      public: true,
    };
    const createUrl = `${baseSpotifyURL}/users/${userInfo.id}/playlists`;
    axios
      .post(createUrl, playlistData, { headers })
      .then((res) => {
        console.log("Playlist created Successfully");
        const playlistId = res.data.id;
        const songsData = { uris: tracks };
        const addSongsURL = `${baseSpotifyURL}/users/${userInfo.id}/playlists/${playlistId}/tracks`;
        axios
          .post(addSongsURL, songsData, { headers })
          .then((songRes) => {
            console.log(songRes);
          })
          .catch((songErr) => {
            console.log(songErr);
          });
      })
      .catch((err) => {
        console.log("Failed to create playlist");
      });
  };

  return (
    <div className="Home">
      <input
        id="artistSearch"
        name="artistSearch"
        type="text"
        placeholder="Search for Artist"
        value={artist}
        onChange={(event) => setArtist(event.target.value)}
      ></input>

      <button onClick={() => getArtistInfo()}>Search</button>
      <button onClick={() => createPlaylist()}>Create Playlist</button>
      <br />
    </div>
  );
}

export default Home;
