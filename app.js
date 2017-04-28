var noble = require('noble');

// UART サービス UUID
var UARTSERVICE_SERVICE_UUID = '6E400001B5A3F393E0A9E50E24DCCA9E'.toLowerCase();

// 操作したいpinのID
var UART_RX_CHARACTERISTIC_UUID    =  '6E400002B5A3F393E0A9E50E24DCCA9E'.toLowerCase();
var UART_TX_CHARACTERISTIC_UUID    =  '6E400003B5A3F393E0A9E50E24DCCA9E'.toLowerCase();

// characteristicを格納する変数
var UART_RX_CHARACTERISTIC;
var UART_TX_CHARACTERISTIC;

var localName = "BBC micro:bit";

// 状態がパワーONだったらスキャンに移行
noble.on('stateChange', function(state) {
    console.log('on -> stateChange: ' + state);

    if (state === 'poweredOn') {
        //Service UUID指定でスキャンを開始する
        noble.startScanning([],true);
    } else {
        noble.stopScanning();
    }
});

noble.on('scanStart', function() {
    console.log('on -> scanStart');
});

noble.on('scanStop', function() {
    console.log('on -> scanStop');
});

// discover 機器が発見されたら
noble.on('discover', function(peripheral) {
    //console.log('on -> discover');
    var peripheralLocalName = peripheral['advertisement']["localName"];
    if(peripheralLocalName !== localName){
      return;
    }
    console.log("on -> discover localName "+peripheralLocalName);

    // スキャンをとめる
    noble.stopScanning();

    // KONASHI接続時のイベント
    peripheral.on('connect', function() {
        console.log('on -> connect');
        this.discoverServices();
    });
    // KONASHI切断時のイベント
    peripheral.on('disconnect', function() {
        console.log('on -> disconnect');
    });

    // 見つけたサービス（機器）へのアクセス
    peripheral.on('servicesDiscover', function(services) {
        //console.log("servicesDiscover");
        //console.log(services);
        for(i = 0; i < services.length; i++) {
            //console.log("services uuid:"+services[i]['uuid']);

            // サービスが UARTSERVICE_SERVICE_UUID と一致した時だけ処理
            if(services[i]['uuid'] == UARTSERVICE_SERVICE_UUID){

                // サービスのcharacteristic捜索
                services[i].on('includedServicesDiscover', function(includedServiceUuids) {
                    console.log('on -> service included services discovered [' + includedServiceUuids + ']');
                    this.discoverCharacteristics();
                });

                // characteristic取得イベント
                services[i].on('characteristicsDiscover', function(characteristics) {

                    // characteristics配列から必要なCHARACTERISTICSをUUIDから判断してcharacteristic格納
                    for(j = 0; j < characteristics.length; j++) {
                        //console.log("uuid "+characteristics[j].uuid);

                        var characteristic = characteristics[j];
                        if(UART_RX_CHARACTERISTIC_UUID == characteristic.uuid){
                            console.log("UART_RX_CHARACTERISTIC_UUID exist!!");
                            UART_RX_CHARACTERISTIC = characteristic;
                            //indicate
                            UART_RX_CHARACTERISTIC.on('data', function(data, isNotification){
                                console.log("data");
                                console.log(data);
                            });
                            //RXを購読する
                            UART_RX_CHARACTERISTIC.subscribe(function(error){
                              if(error != null){
                                console.log(error);
                              }
                            });
                        }
                        if(UART_TX_CHARACTERISTIC_UUID == characteristic.uuid){
                            console.log("UART_TX_CHARACTERISTIC_UUID exist!!");
                            UART_TX_CHARACTERISTIC = characteristic;
                            //writeWithoutResponse
                        }
                    }
                });

                services[i].discoverIncludedServices();
            }
        }

    });

    // 機器との接続開始
    peripheral.connect();
});
