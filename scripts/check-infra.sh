#!/bin/bash

# check-infra.sh - Verifies if the infrastructure exists using terraform outputs

cd infra

# Attempt to get vm_ip output
VM_IP=$(terraform output -raw vm_ip 2>/dev/null)

if [ -z "$VM_IP" ] || [[ "$VM_IP" == *"No outputs"* ]]; then
  echo "Error: Infrastructure does not exist or vm_ip output is missing."
  exit 1
fi

echo "Infrastructure found. VM IP: $VM_IP"
exit 0
