import './install-globals';
import React from 'react';
import { StyleSheet, Text, View, ToastAndroid, AsyncStorage } from 'react-native';
import createSbot from './sbot';
import NetworkInfo from 'react-native-network-info';
const ssbKeys = require('ssb-keys');
const path = require('path');
const pull = require('pull-stream');
const config = require('ssb-config');

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {keys: {public: '', private: '', id: ''}}
  }

  componentDidMount() {
    NetworkInfo.getIPAddress(ip => {
      ssbKeys.loadOrCreate(path.join('~/.ssb', 'secret'), (err, keys) => {
        if (err) {
          ToastAndroid.show(err, ToastAndroid.LONG)
        } else {
          this.setState((prevState, props) => { return {keys} })
          // create a scuttlebot client using default settings
          // (server at localhost:8080, using key found at ~/.ssb/secret)
          config.keys = keys
          config.host = ip
          console.log(keys.id)
          const sbot = createSbot(config)

          AsyncStorage.getAllKeys((err, keys) => {
            if (err) {
              console.error(err)
            } else {
              console.log('AsyncStorage getAllKeys', keys);
              keys.forEach(key => {
                AsyncStorage.getItem(key, (err2, value) => {
                  console.log('AsyncStorage', key, value)
                })
              })
            }
          })

          // stream all messages in all feeds, ordered by receive time
          pull(
            sbot.createFeedStream(),
            pull.collect(function (err, msgs) {
              console.log('createFeedStream', err, msgs)
              // ToastAndroid.show(msgs, ToastAndroid.LONG);
              // msgs[0].key == hash(msgs[0].value)
              // msgs[0].value...
            })
          )

          console.log('gossip.peers', sbot.gossip.peers())

          sbot.gossip.changes(function (err, changes) {
            console.log('gossip.changes', changes)
          })

          sbot.gossip.add(
            '192.168.1.107:8008:@/AM2aoINDzNh6OwpOmT6BlC+CpSelAPDZL+ihjdyQXo=.ed25519',
            'local'
          )

          sbot.replicate.changes(function (err, changes) {
            console.log('replicate.changes', changes)
          })

          sbot.friends.all('follow', function (err, friends) {
            console.log('friends.all', JSON.stringify(friends, null, '  '))
          })

          sbot.publish({ type: 'post', text: 'First Post from Android!' }, function (err, msg) {
            if (err) {
              console.error(err)
            } else {
              console.log('sbot publish', msg)
            }
            // msg.key           == hash(msg.value)
            // msg.value.author  == your id
            // msg.value.content == { type: 'post', text: 'My First Post!' }
            // ...
          })
        }
      })
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
})
