#!/usr/bin/env python3
"""
Test WebSocket connection to FreeSWITCH via Cloudflare Tunnel
"""

import asyncio
import websockets
import ssl
import sys

async def test_websocket():
    url = "wss://freeswitch.aidevelo.ai"
    
    print(f"Testing WebSocket connection to: {url}")
    print("=" * 60)
    
    try:
        # Disable SSL verification for testing (Cloudflare handles SSL)
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        print("Attempting connection...")
        async with websockets.connect(
            url,
            ssl=ssl_context,
            timeout=10
        ) as websocket:
            print("✅ WebSocket connection established!")
            print("Connection details:")
            print(f"  - Remote address: {websocket.remote_address}")
            print(f"  - Protocol: {websocket.subprotocol}")
            
            # Try to send a test message
            try:
                await websocket.send("test")
                print("✅ Message sent successfully")
            except Exception as e:
                print(f"⚠️  Could not send message: {e}")
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5)
                print(f"✅ Received response: {response[:100]}")
            except asyncio.TimeoutError:
                print("⚠️  No response received (timeout)")
            except Exception as e:
                print(f"⚠️  Error receiving: {e}")
                
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"❌ Invalid status code: {e.status_code}")
        print(f"   Response headers: {e.headers}")
        if e.status_code == 502:
            print("   → This usually means Cloudflare Tunnel is not running or misconfigured")
        elif e.status_code == 503:
            print("   → Service unavailable - FreeSWITCH might not be running")
        elif e.status_code == 404:
            print("   → Route not found - check Cloudflare Tunnel configuration")
    except websockets.exceptions.ConnectionClosed as e:
        print(f"❌ Connection closed: {e.code} - {e.reason}")
    except asyncio.TimeoutError:
        print("❌ Connection timeout - server not responding")
    except Exception as e:
        print(f"❌ Connection failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_websocket())

