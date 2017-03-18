import './install-globals';
import React from 'react';
import { StyleSheet, Text, View, ToastAndroid } from 'react-native';
const ssbkeys = require('ssb-keys');
const path = require('path');

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {keys: {public: '', private: '', id: ''}};
  }

  componentDidMount() {
    ssbkeys.loadOrCreate(path.join('~/.ssb', 'secret'), (err, keys) => {
      if (err) {
        ToastAndroid.show(err, ToastAndroid.LONG);
      } else {
        this.setState((prevState, props) => { return {keys}; });
      }
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={{fontSize: 20}}>key: {this.state.keys.id}</Text>
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
