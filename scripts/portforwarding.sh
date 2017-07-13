#!/bin/sh
# setup /etc/hosts so that the crypto servers are configured

ssh -f -N -L 8545:localhost:8545 burton@eth-server
ssh -f -N -L 9332:localhost:9332 burton@ltc-server  
ssh -f -N -L 18082:localhost:18082 burton@xmr-server  
ssh -f -N -L 6006:localhost:6006 burton@xrp-server

