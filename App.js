import React from 'react';
// import * as ssbKeys from 'ssb-keys';
import { StyleSheet, Text, View } from 'react-native';
import './install-globals';
const path = require('path');

const b = new Buffer('foobar');

export default class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text>key: {153123}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
