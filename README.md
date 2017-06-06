**Work in progress** Proof of Concept SSB app for mobile.

Using React Native. Currently focuses on Android.

## Usage

Check out React Native's instructions for setting up your dev environment first.

So far, this only works with `npm@4`, **not** `npm@5`.

Then, `npm install`. This will also run some hacks like `patch-package && npm run fix-shims && npm run rn-nodeify && npm run patch-dependencies` to patch some libraries.

Then, `npm run android`.

You should be able to replicate data from another sbot in LAN to the mobile app's sbot. Run the React Native app in debug mode in Chrome to see logs.
