@echo off
title Servidor DX Plan
echo Iniciando servidor web para la red local...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar_servidor.ps1"
