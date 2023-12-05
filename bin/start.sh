#!/usr/bin/env bash
if [ "$_PRELUDE_" != "true" ]; then
  source "${PWD}/bin/prelude.sh"
fi

if [[ "$1" == "stage" || "$1" == "prod" ]]; then
   echo -e "\n\n\033[31mStage and Prod envs are not allowed, running as Dev.\033[0m"
fi

if [[ "$1" != "" && "$1" != "stage" && "$1" != "prod" ]]; then
  mode="$1"
  source $ROOT_FOLDER/.env.$mode
else
  mode="dev"
  source $ROOT_FOLDER/.env
fi

export ENV_MODE=$mode

$ROOT_FOLDER/bin/start-containers.sh $mode; result=$?

if [ "$result" != '0' ]; then
  echo "Failed to initialize pg docker"
  exit $result
else
  npx ts-node $ROOT_FOLDER/servers/battle/index.ts
fi