const autocomplete = (addressInputElem, latInputElem, lngInputElem) => {
  if (!addressInputElem) return;

  const dropdown = new google.maps.places.Autocomplete(addressInputElem);
  
  dropdown.addListener('place_changed', () => {
    const place = dropdown.getPlace();
    latInputElem.value = place.geometry.location.lat();
    lngInputElem.value = place.geometry.location.lng();
  });

  addressInputElem.on('keydown', e => {
    if (e.keyCode === 13) e.preventDefault();
  });
};

export default autocomplete;