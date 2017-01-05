const USERNAME = "secret";
const PASSWORD = "secret";
const URL = "https://my.automation.domain/measurement";
HEADERS <- {
  "Authorization" : "Basic " + http.base64encode(USERNAME + ":" + PASSWORD),
  "Content-Type": "application/json"
};


function postTemperatureAndHumidity(result) {
  local data = { "type" : "temperature",
                 "value" : result.temperature,
                 "location" : "living_room" };
  local body = http.jsonencode(data);

  server.log(body);

  local response = http.post(URL, HEADERS, body).sendsync();
  server.log("Code: " + response.statuscode + ". Message: " + response.body);

  data = { "type" : "humidity",
           "value" : result.humidity,
           "location" : "living_room" };
  body = http.jsonencode(data);

  server.log(body);

  response = http.post(URL, HEADERS, body).sendsync();
  server.log("Code: " + response.statuscode + ". Message: " + response.body);
}

function postLight(light) {
  local data = { "type" : "light",
                 "value" : light,
                 "location" : "living_room" };
  local body = http.jsonencode(data);

  server.log(body);

  local response = http.post(URL, HEADERS, body).sendsync();
  server.log("Code: " + response.statuscode + ". Message: " + response.body);
}

function postPressure(pressure) {
  local data = { "type" : "pressure",
                 "value" : pressure,
                 "location" : "living_room" };
  local body = http.jsonencode(data);

  server.log(body);

  local response = http.post(URL, HEADERS, body).sendsync();
  server.log("Code: " + response.statuscode + ". Message: " + response.body);
}

device.on("temperatureAndHumidity", postTemperatureAndHumidity);
device.on("light", postLight);
device.on("pressure", postPressure);

// TODO: Be able to trigger measurement reading remotely
