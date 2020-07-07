import React, { useEffect } from "react";

function Search(props) {
  const { artist } = props;
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      props.onSearchClick();
    }
  };

  return (
    <div class="form__group field">
      <input
        type="text"
        class="form__field"
        id="artistSearch"
        value={artist}
        name="artistSearch"
        onChange={(event) => props.searchHandler(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <label for="artistSearch" class="form__label">
        Search for Artist
      </label>
    </div>
  );
}

export default Search;
