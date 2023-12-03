#!/bin/bash

if [ "$_PRELUDE_" != "true" ]; then
  source "${PWD}/bin/prelude.sh"
fi

if [[ "$1" == "" ]]; then
    echo -e "\n\n\033[31mApplication path can't be empty\033[0m"
    echo -e "\n\033[33mEx: build.sh application_fold_to_build\033[0m\n\n"
    exit 1
fi

rm -rf ./dist
mkdir ./dist
chmod -R 777 dist
echo "Start tsc build"
APP_DIR=$(dirname "$BASE_APP_FOLDER/$1/.")

npx tsc -b $APP_DIR

echo "Copying project root files"
cp "$APP_DIR/package.json" ./dist

echo "Install modules..."
cd ./dist
npm pkg set main="./$BASE_APP_FOLDER_NAME/$1/index.js"

mkdir ./node_modules
chmod -R 777 node_modules

npm i --production

echo "Ziping..."
BUILD_NAME=$(basename $1)
zip -r "./${BUILD_NAME}-build.zip" .
cd ..

echo "Done"
    if [ "$1" = "-o" ]; then
        nautilus ./dist
    fi
exit 0