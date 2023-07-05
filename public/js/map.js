import 'bingmaps'; // <--  Microsoft supported types library for Microsoft.Maps
import { initialize, whenLoaded } from 'bing-maps-loader';

const API_KEY =
  'AjxnDjagPGP47k7cMNdFsrxgsumhCoo5swD0z5lnNNilc4rdhdo6QkRjtxug0smY';

initialize(API_KEY);

export const getCallBack = (locations) => {
  var [lng, lat] = locations[0].coordinates;
  whenLoaded.then(() => {
    const map = new Microsoft.Maps.Map('#map');

    map.setView({
      mapTypeId: Microsoft.Maps.MapTypeId.road,
      center: new Microsoft.Maps.Location(lat, lng),
      zoom: 8,
    });

    // Set zoom and Panning false
    map.setOptions({
      disableZooming: true,
      disablePanning: false,
    });
    // Adding markers
    locations.forEach((location) => {
      const [lng, lat] = location.coordinates;
      const loc = new Microsoft.Maps.Location(lat, lng);
      //Create custom Pushpin using a url to an SVG and Add a pushpin at the user's location.
      const pin = new Microsoft.Maps.Pushpin(loc, {
        anchor: new Microsoft.Maps.Point(25, 50),
        title: location.description,
        text: `${location.day}`,
      });
      pin.setOptions({ enableHoverStyle: true, enableClickedStyle: true });
      map.entities.push(pin);
    });
  });
};
