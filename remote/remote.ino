void setup() {
    pinMode(D0, OUTPUT);
    pinMode(D1, OUTPUT);
    pinMode(D2, OUTPUT);
    pinMode(D3, OUTPUT);
    pinMode(D4, OUTPUT);
    pinMode(D5, OUTPUT);

    digitalWrite(D0, LOW);
    digitalWrite(D1, LOW);
    digitalWrite(D2, LOW);
    digitalWrite(D3, LOW);
    digitalWrite(D4, LOW);
    digitalWrite(D5, LOW);

    Particle.function("turnOn", turnOn);
    Particle.function("turnOff", turnOff);
}

void loop() {

}

int turnOn(String group) {
    int pin;

    if (group == "1") {
        pin = D0;
    } else if (group == "2") {
        pin = D2;
    } else if (group == "3") {
        pin = D4;
    } else {
        return -1;
    }

    digitalWrite(pin, HIGH);
    delay(2000);
    digitalWrite(pin, LOW);

    return 1;
}

int turnOff(String group) {
    int pin;

    if (group == "1") {
        pin = D1;
    } else if (group == "2") {
        pin = D3;
    } else if (group == "3") {
        pin = D5;
    } else {
        return -1;
    }

    digitalWrite(pin, HIGH);
    delay(2000);
    digitalWrite(pin, LOW);

    return 0;
}
