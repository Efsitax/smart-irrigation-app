package com.kadir.smartirrigation

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.*
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.IOException
import java.util.*

class ClassicBluetoothModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    private var socket: BluetoothSocket? = null

    override fun getName(): String {
        return "ClassicBluetoothModule"
    }

    private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == BluetoothDevice.ACTION_FOUND) {
            val device: BluetoothDevice? =
                intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)

            if (device != null && !device.name.isNullOrBlank()) {
                val map = Arguments.createMap().apply {
                    putString("id", device.address)
                    putString("name", device.name)
                }
                sendEvent("DeviceFound", map)
            }
        }
    }
}

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun startScan() {
        val filter = IntentFilter(BluetoothDevice.ACTION_FOUND)
        filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED)
        reactContext.registerReceiver(receiver, filter)
        bluetoothAdapter?.startDiscovery()
    }

    @ReactMethod
    fun stopScan() {
        try {
            reactContext.unregisterReceiver(receiver)
        } catch (e: IllegalArgumentException) {
            // already unregistered
        }
        bluetoothAdapter?.cancelDiscovery()
    }

    @ReactMethod
    fun connectToDevice(id: String, promise: Promise) {
        val device = bluetoothAdapter?.getRemoteDevice(id)
        bluetoothAdapter?.cancelDiscovery()

        try {
            socket = device?.createRfcommSocketToServiceRecord(
                UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
            )
            socket?.connect()
            promise.resolve(true)
        } catch (e: IOException) {
            promise.reject("CONNECTION_FAILED", e.message)
        }
    }

    @ReactMethod
    fun sendData(data: String, promise: Promise) {
        try {
            socket?.outputStream?.write(data.toByteArray())
            socket?.outputStream?.flush()
            promise.resolve(true)
        } catch (e: IOException) {
            promise.reject("SEND_FAILED", e.message)
        }
    }

    @ReactMethod
    fun disconnect() {
        try {
            socket?.close()
        } catch (_: IOException) {}
    }
}