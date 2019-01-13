/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import { Vibration, Text, TouchableOpacity, Dimensions, View } from 'react-native';
import BluetoothSerial from "react-native-bluetooth-serial";
import { StackedAreaChart } from 'react-native-svg-charts';
import * as shape from 'd3-shape'
// import AudioPlayer from 'react-native-play-audio';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

// Vibration.vibrate(100007)

// AudioPlayer.prepare("https://www.freesoundeffects.com/mp3_466323.mp3", () => {
//   AudioPlayer.play();
    
//   AudioPlayer.getDuration((duration) => {
//     console.log(duration);
//   });
//   setInterval(() => {
//     AudioPlayer.getCurrentTime((currentTime) => {
//       console.log(currentTime);
//     });
//   }, 1000);
//   AudioPlayer.stop();
//   AudioPlayer.pause();
//   AudioPlayer.setCurrentTime(50.5);
// })

export default class App extends Component {
  constructor(props) {
    super(props);
    this.tryConnect = this.tryConnect.bind(this);
    this.tryConnect();
    
    this.dataNew1 = [];
    this.dataNew2 = [];

    this.dataRaw1 = [];
    this.dataRaw2 = [];

    this.startTime = null;
    this.endTime = null;

    BluetoothSerial.withDelimiter('\r').then(() => {
      BluetoothSerial.on('read', data => {
        // console.log(`DATA FROM BLUETOOTH: ${data.data}`);
        const current = data.data.split(" ");
        let dataNew1_temp = [...this.dataNew1];
        let dataNew2_temp = [...this.dataNew2];
        
        let dataRaw1_temp = [...this.dataRaw1];
        let dataRaw2_temp = [...this.dataRaw2];
        
        dataNew1_temp.push({
          acc: parseInt(current[0]),
        });

        dataRaw1_temp.push(parseInt(current[0]));

        dataNew2_temp.push({
          clutch: parseInt(current[1]),
        });
        dataRaw2_temp.push(parseInt(current[1]));

        if(dataNew1_temp.length > 150) {
          dataNew1_temp.shift();
        }
        if(dataRaw1_temp.length > 50) {
          dataRaw1_temp.shift();
        }

        if(dataNew2_temp.length > 150) {
          dataNew2_temp.shift();
        }
        if(dataRaw2_temp.length > 50) {
          dataRaw2_temp.shift();
        }

        console.log(current);

        this.dataNew1  = dataNew1_temp;
        this.dataNew2  = dataNew2_temp;
        this.dataRaw1  = dataRaw1_temp;
        this.dataRaw2  = dataRaw2_temp;
        // this.setState({ dataNew: vals });
     });
      
      BluetoothSerial.on('connectionSuccess', data => {
        this.setState({ connected: true })
      });
      
      BluetoothSerial.on('connectionLost', data => {
        this.setState({ connected: false })
      });
    });
    setInterval(() => {
      this.setState({ data1: this.dataNew1, data2: this.dataNew2 });
    }, 20);
    
    setInterval(() => {
      let dataRaw1 = this.dataRaw1;
      let dataRaw2 = this.dataRaw2;
      const average = list => list.reduce((prev, curr) => prev + curr) / list.length;
      if(dataRaw1.length === 0 || dataRaw2.length === 0) return;
      const clutch = average(dataRaw2);
      const acc = average(dataRaw1);
      if( ( this.state.step === 0 ) && acc > 80 && clutch > 80 ) {
        this.setState({ step: 1 })
      }
      if( ( this.state.step === 1 ) && acc < 10 && clutch > 80 ) {
        if(this.startTime === null) {
          this.startTime = new Date().getTime();
        }
        this.setState({ step: 2 })
      }
      if( this.state.step === 2 ) {
        if(acc > 50) return Vibration.vibrate(1000);
        if(acc < 20) return Vibration.vibrate(1000);
        if(clutch > 50) return Vibration.vibrate(1000);
        if(clutch < 20) return Vibration.vibrate(1000);
        this.setState({ step: 3, result: new Date().getTime() - this.startTime })
        this.startTime = null;
        setTimeout(() => this.setState({ step: 0 }), 5000);
      }
      
      console.log(acc, clutch);
    }, 500);
  }

  state = {
    connected: false,
    data1: [],
    data2: [],
    speed: 0.0,
    dataNew: [],
    progress: 20,
    step: 0,
    result: ''
  }

  tryConnect = () => {
    // BluetoothSerial.discoverUnpairedDevices()
    //   .then((a) => {
    //     a.forEach((value) => {
    //       console.log(value);
    //       if(value.address === "98:D3:32:70:8B:76") {
    //         BluetoothSerial.connect(value.id);
    //       }
    //     })
    // })
    BluetoothSerial.connect("98:D3:32:70:8B:76");
  }

  render() {
    const colors = [ '#aa00ff', '#cc66ff' ]
    const keys   = [ 'acc', 'clutch' ]
    const svgs = [
        { onPress: () => console.log('acc') },
        { onPress: () => console.log('clutch') }
    ]
    return (
      <View style={{ 
        justifyContent: 'center', 
        flex: 1,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'center'
      }}>
        <TouchableOpacity>
          <View style={{
            marginLeft: 10,
            width: 100,
            marginTop: 10,
            height: HEIGHT-40,
            borderRadius: 20,
            backgroundColor: '#c0c0c0',
            overflow: "hidden"
          }}>
            <StackedAreaChart
              style={ { height: HEIGHT} }
              data={ this.state.data2 }
              keys={ ['clutch'] }
              colors={ ['green'] }
              curve={ shape.curveNatural }
              showGrid={ false }
              svgs={ svgs }
            />
            <Text style={{
              position: 'absolute',
              bottom: 10,
              left: 5,
              right: 5,
              textAlign: 'center',
              backgroundColor: '#fff',
              borderRadius: 20
            }}>
              CLUTCH
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{
          flex: 1,
          width: 100,
          backgroundColor: '#fff'
        }}>
          <Text 
            style={{
              marginTop: 30,
              padding: 5,
              textAlign: 'center',
              color: '#333',
              fontSize: 25,
              flex: 1
            }}
          >
            { !this.state.connected && "Connecting"}
            { this.state.connected && this.state.step === 0 && "Press both the accelerator and clutch 100% to get started" }
            { this.state.connected && this.state.step === 1 && "Release the accelerator completely while holding down the clutch" }
            { this.state.connected && this.state.step === 2 && "slowly release the clutch to about halfway and accelerate slowly" }
            { this.state.connected && this.state.step === 3 && "Rinse and repeat, to improve your skills" }
          </Text>

          <Text
            style={{
              color: '#fff',
              fontSize: 25,
              flex: 1
            }}
          >
            {this.state.result}
          </Text>
          
        </View>
      
        <TouchableOpacity>
          <View style={{
            width: 100,
            marginTop: 10,
            marginRight: 10,
            height: HEIGHT-40,
            borderRadius: 20,
            backgroundColor: '#c0c0c0',
            overflow: "hidden"
          }}>
            <StackedAreaChart
              style={ { height: HEIGHT} }
              data={ this.state.data1 }
              keys={ ['acc'] }
              colors={ ['red'] }
              curve={ shape.curveNatural }
              showGrid={ false }
              svgs={ svgs }
            />
            <Text style={{
              position: 'absolute',
              bottom: 10,
              left: 5,
              right: 5,
              textAlign: 'center',
              backgroundColor: '#fff',
              borderRadius: 20
            }}>
              ACCEL.
            </Text>
          </View>
        </TouchableOpacity>
        

        
      </View>
    );
  }
}
