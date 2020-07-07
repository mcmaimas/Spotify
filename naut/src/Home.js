import React, { useEffect } from "react";
import queryString from "query-string";
import axios from "axios";
import request from "request";

import Search from "./components/Search";
import SearchResults from "./components/SearchResults";

require("dotenv").config();

function Home(props) {
  const [accessToken, setAccessToken] = React.useState("");
  const [refreshToken, setRefreshToken] = React.useState("");
  const [userInfo, setUserInfo] = React.useState({});

  const [artist, setArtist] = React.useState("");
  const [artistInfo, setArtistInfo] = React.useState("");
  const [headers, setHeaders] = React.useState({});
  const [playListInfo, setPlaylistInfo] = React.useState();

  const queryParams = queryString.parse(props.location.search);
  const baseSpotifyURL = "https://api.spotify.com/v1";

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
      .catch(console.error);
  };

  const getArtistInfo = () => {
    const artistString = encodeURIComponent(artist.trim());
    const url = `${baseSpotifyURL}/search?q=${artistString}&type=artist`;
    axios
      .get(url, { headers })
      .then((res) => {
        setArtistInfo(res.data.artists.items[0]);
        getRelatedArtists(res.data.artists.items[0].id);
      })
      .catch(console.error);
  };

  useEffect(() => {
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
          new Buffer(
            process.env.REACT_APP_CLIENT_ID +
              ":" +
              process.env.REACT_APP_CLIENT_SECRET
          ).toString("base64"),
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

  const createPlaylist = () => {
    const tracks = playListInfo.map((related) => {
      return `spotify:track:${related.data.tracks[0].id}`;
    });
    const playlistData = {
      name: `🚀 - ${artist}`,
      description: `${artist}: Related artist`,
      public: true,
    };
    const createUrl = `${baseSpotifyURL}/users/${userInfo.id}/playlists`;
    axios
      .post(createUrl, playlistData, { headers })
      .then((res) => {
        const playlistId = res.data.id;
        const songsData = { uris: tracks };
        const addSongsURL = `${baseSpotifyURL}/users/${userInfo.id}/playlists/${playlistId}/tracks`;
        axios
          .post(addSongsURL, songsData, { headers })
          .then((songRes) => {
            console.log(songRes);
          })
          .catch(console.error);
      })
      .catch(console.error);
  };

  return (
    <div className="Home">
      <Search searchHandler={setArtist} onSearchClick={getArtistInfo} />

      {artistInfo.images && (
        <SearchResults
          artistInfo={artistInfo}
          createPlaylist={createPlaylist}
        />
      )}
    </div>
  );
}

export default Home;
