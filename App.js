import './install-globals';
import React from 'react';
import { StyleSheet, Text, View, ToastAndroid } from 'react-native';
import * as ssbkeys from 'ssb-keys';

var myKeys = ssbkeys.generate();

export default class App extends React.Component {
  componentDidMount() {
    // ToastAndroid.show('hi', ToastAndroid.SHORT);
    // ToastAndroid.show(JSON.stringify(sodium), ToastAndroid.LONG);
    // ToastAndroid.show(JSON.stringify(chloride.to_hex), ToastAndroid.LONG);
    // ToastAndroid.show('' + sodium.to_hex, ToastAndroid.LONG);
    // ToastAndroid.show(sodium.to_hex.toString(), ToastAndroid.SHORT);
    // ToastAndroid.show(sodium.crypto_generichash.toString(), ToastAndroid.SHORT);
    // const thing = sodium.to_hex(sodium.crypto_generichash(64, 'test'));
    // ToastAndroid.show(thing, ToastAndroid.LONG);
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={{fontSize: 20}}>key: {myKeys.id}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffc',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
