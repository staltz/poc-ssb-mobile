import './install-globals';
import React from 'react';
import {
  StyleSheet, Text, View, ToastAndroid, AsyncStorage, TextInput, Button,
} from 'react-native';
import createSbot from './sbot';
import NetworkInfo from 'react-native-network-info';
const ssbKeys = require('ssb-keys');
const path = require('path');
const pull = require('pull-stream');
const config = require('ssb-config');

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      keys: {public: '', private: '', id: ''},
      feed: []
    }
  }

  componentDidMount() {
    NetworkInfo.getIPAddress(ip => {
      console.log('got ip', ip)
      const p = path.join('.ssb', 'secret')
      ssbKeys.loadOrCreate(p, (err, keys) => {
        if (err) {
          ToastAndroid.show(err, ToastAndroid.LONG)
        } else {
          this.setState((prevState, props) => { return {keys} })
          // create a scuttlebot client using default settings
          // (server at localhost:8080, using key found at ~/.ssb/secret)
          config.keys = keys
          config.host = ip
          const sbot = createSbot(config)
          this.sbot = sbot;

          // stream all messages in all feeds, ordered by receive time
          pull(
            sbot.createFeedStream({live: true}),
            pull.drain((msg) => {
              if (msg && msg.value && msg.value.content) {
                this.setState(function (prevState) {
                  return {
                    ...prevState,
                    feed: prevState.feed.concat(msg.value.content.text),
                  }
                })
              }
            })
          )

          console.log('gossip.peers', sbot.gossip.peers())

          sbot.gossip.changes(function (err, changes) {
            console.log('gossip.changes', changes)
          })

          const text = 'from android ' + (Date.now() % 50);
          sbot.publish({type: 'post', text: text}, function (err, msg) {
            if (err) {
              console.error(err)
            } else {
              console.log('published message', msg)
            }
          })
        }
      })
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={{fontSize: 20}}>key: {this.state.keys.id}</Text>
        <Text style={{fontSize: 20}}>{this.state.feed.join('\n')}</Text>
        <TextInput
          placeholder="Enter new post"
          style={styles.textInput}
          ref="leinput"
          onSubmitEditing={(event) => {
            this.sbot.publish({type: 'post', text: event.nativeEvent.text}, function (err, msg) {
              if (err) {
                console.error(err)
              } else {
                console.log('published message', msg)
              }
            })
            this.refs['leinput'].clear();
          }}
        />
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
  textInput: {
    minWidth: 250,
    backgroundColor: 'white',
  },
})
