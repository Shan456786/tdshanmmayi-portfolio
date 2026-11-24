// SmartCrutch+. See src/data/projects/index.js for how entries are used.
export default { name: 'SmartCrutch+', tcls: 'ptt pt-sc', c: '#1D45D6', fg: '#FCEFC7', tag: 'PROTOTYPE', line: 'Rehabilitation monitoring prototype: live crutch load and angle, with configurable safety alerts.', tags: 'ESP32 / TYPESCRIPT / WEB SERIAL',
    repo: 'https://github.com/Shan456786/SmartCrutch-', demo: '',
    cs: {
      kind: 'sc', kicker: 'HARDWARE / REHABILITATION PROTOTYPE', type: 'Hardware prototype', started: 'Oct 2026', interactive: 'Signal chain and serial parser lab',
      deck: 'A crutch that reports its own load and angle. An ESP32 reads the sensors and sends one JSON line every 200 ms over USB. A React dashboard turns that stream into live monitoring, alerts and recorded sessions.',
      overview: 'SmartCrutch+ is a physically assembled crutch prototype with a load cell and an accelerometer, plus a browser dashboard that reads it through the Web Serial API. It shows load and angle live, warns when configurable limits are passed, and records sessions.',
      problem: 'During rehabilitation, how much weight goes through a crutch and how far it tilts are hard to see. The prototype makes both visible while the crutch is in use.',
      role: 'Independently developed: assembled the hardware, wrote the ESP32 firmware and its JSON serial protocol, and built the React dashboard.',
      notice: 'Student prototype. Not a medically validated device. Thresholds are configurable examples, not clinical guidance. Weight readings are not calibrated grams. Fall detection is not implemented.',
      stack: [
        { g: 'Hardware', items: ['ESP32', 'HX711 + load cell', 'ADXL345 accelerometer', 'SSD1306 OLED', 'Buzzer and LEDs'] },
        { g: 'Firmware', items: ['C++ (Arduino)', 'GyverHX711', 'Adafruit ADXL345', 'Adafruit SSD1306'] },
        { g: 'Dashboard', items: ['React 18', 'TypeScript', 'Vite', 'Web Serial API'] }
      ],
      bom: [
        { k: 'ESP32', v: 'Reads both sensors, drives the OLED, LEDs and buzzer, writes the serial stream' },
        { k: 'HX711 + load cell', v: 'Data GPIO 32, clock GPIO 33. Tared at power-up' },
        { k: 'ADXL345', v: 'I2C on GPIO 21 (SDA) and 22 (SCL), ±16 g range' },
        { k: 'SSD1306 OLED', v: '128 × 64, I2C 0x3C, the "Rehab Safety Monitor" screen' },
        { k: 'Buzzer', v: 'GPIO 25, active high. Sounds only while readings are valid and unsafe' },
        { k: 'LEDs', v: 'Red on GPIO 16, green on GPIO 17' }
      ],
      chain: [
        { t: 'Load cell + HX711', k: 'SENSE', d: 'Load through the crutch. Tared at power-up, then read() / 230. The /230 factor is not verified against reference weights, so the value is not calibrated grams.', spec: 'GPIO 32 / 33 / gain 64 / 1000 ms timeout' },
        { t: 'ADXL345', k: 'SENSE', d: 'Crutch angle from the accelerometer: atan2(y, z) × 180 / π.', spec: 'I2C / GPIO 21 SDA, 22 SCL / ±16 g' },
        { t: 'ESP32 firmware', k: 'DECIDE', d: 'Every 200 ms, when both sensors are valid, the firmware writes one JSON line and makes its own unsafe decision. If a sensor is not valid, it sends no JSON at all and prints an error line every 2 seconds instead.', spec: 'MAX_WEIGHT_G 800 / MAX_TILT_ANGLE 20.0' },
        { t: 'USB serial', k: 'SEND', d: 'One JSON object per line: type, weight_g, angle_deg and unsafe.', spec: '115200 baud / protocol v1' },
        { t: 'Web Serial API', k: 'RECEIVE', d: 'The browser asks for a port, opens it at 115200 baud and reads it in a loop. No server is involved.', spec: 'Desktop Chrome or Edge / localhost or HTTPS' },
        { t: 'React dashboard', k: 'SHOW', d: 'Every line is validated before it becomes a reading. Valid readings drive live charts, alerts against configurable thresholds and session recording with CSV export.', spec: 'parseProtocolLine() / thresholds / sessions' }
      ],
      samples: [
        { label: 'Valid reading', line: '{"type":"smartcrutch","weight_g":412.0,"angle_deg":-3.5,"unsafe":false}' },
        { label: 'Unsafe reading', line: '{"type":"smartcrutch","weight_g":912.0,"angle_deg":24.0,"unsafe":true}' },
        { label: 'Firmware error line', line: 'SmartCrutch+ ERROR: ADXL345 not detected at startup (check I2C wiring, then reboot)' },
        { label: 'Half a line', line: '{"type":"smartcrutch","weight_g":41' },
        { label: 'Angle out of range', line: '{"type":"smartcrutch","weight_g":120.5,"angle_deg":240,"unsafe":false}' },
        { label: 'Wrong message type', line: '{"type":"debug","weight_g":1,"angle_deg":0,"unsafe":false}' }
      ],
      statuses: [
        { k: 'Disconnected', v: 'No port is open' },
        { k: 'Connecting', v: 'The browser is opening the selected port' },
        { k: 'Connected, waiting for data', v: 'The port is open but no valid message has arrived, or none for 3 seconds' },
        { k: 'Live data received', v: 'Valid protocol messages are arriving' },
        { k: 'Web Serial not supported', v: 'The browser cannot use Web Serial' }
      ],
      impl: [
        'Two data sources that never mix. Demo mode runs an in-browser simulator and labels every value SIMULATED / DEMO DATA. Hardware mode shows only readings from the ESP32, labelled LIVE HARDWARE DATA.',
        'Dashboard thresholds default to 30 kg maximum load, a warning at 85% and 25° tilt. One click aligns them with the firmware\'s values (0.8 kg, 85%, 20°).',
        'Session recording counts overload, warning and tilt events and counts crutch strikes with hysteresis: a strike starts above 20% of the load limit and ends below 8%.',
        'Six pages: Dashboard, Live Monitoring, Safety Centre, Session History with CSV export, Patient Profile, and Device and Settings. The app never calls or messages anyone automatically.'
      ],
      decisions: [
        { d: 'One JSON object per line', t: 'Each reading stands alone, so a startup banner or a half-received line is ignored and counted, never turned into a reading.' },
        { d: 'Silence on sensor failure', t: 'The firmware sends no JSON rather than a wrong number. The dashboard shows "waiting for data" instead of stale values.' },
        { d: 'Web Serial, no backend', t: 'The browser talks to the crutch directly and all data stays in the browser. The cost: desktop Chrome or Edge only.' },
        { d: 'Two sets of thresholds', t: 'The firmware decides "unsafe" for the buzzer on its own. The dashboard keeps separate, configurable limits.' },
        { d: 'Demo data is always labelled', t: 'A simulated value can never be mistaken for a hardware reading.' }
      ],
      limits: [
        'Not medically validated. Thresholds are examples, not clinical guidance.',
        'The load factor (/230) has not been checked against reference weights.',
        'Fall detection is not implemented.',
        'Web Serial works only in desktop Chrome or Edge, on localhost or HTTPS.'
      ],
      shots: [],
      sources: ['README.md', 'firmware/SmartCrutchPlus_SerialJSON/SmartCrutchPlus_SerialJSON.ino', 'src/lib/serialProtocol.ts', 'src/lib/serialLink.ts', 'src/lib/defaults.ts', 'src/lib/sessionStats.ts']
    } };
