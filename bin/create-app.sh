#!/bin/bash

if [ "$_PRELUDE_" != "true" ]; then
  source "${PWD}/bin/prelude.sh"
fi

if [[ "$1" == "" ]]; then
    echo -e "\n\n\033[31mApplication name can't be empty\033[0m"
    echo -e "\n\033[33mEx: create-app.sh app_name\033[0m\n\n"
    exit 1
fi


if [ -d "$BASE_APP_FOLDER/$1" ]; then
    echo -e "\n\n\033[31mApp already exists.\033[0m"
    exit 1 
fi

mkdir $BASE_APP_FOLDER/$1

npm init --yes -w $BASE_APP_FOLDER/$1

rootDependencies=$(npm pkg get dependencies)
rootDevDependencies=$(npm pkg get devDependencies)

npm pkg set dependencies="$rootDependencies" --json -w $BASE_APP_FOLDER/$1
npm pkg set devDependencies="$rootDevDependencies" --json -w $BASE_APP_FOLDER/$1
npm pkg delete main -w $BASE_APP_FOLDER/$1

echo -e "export const handler = async (event) => { console.log(\"$name handler is working!\"); };" >> $BASE_APP_FOLDER/$1/index.ts

relativePath=$(realpath --relative-to=$SRC_FOLDER $BASE_APP_FOLDER/$1)
relativeRootPath=$(realpath --relative-to=$BASE_APP_FOLDER/$1 $ROOT_FOLDER)

echo -e "{
  \"extends\": \"$relativeRootPath/tsconfig.json\",
  \"compilerOptions\": {
    \"rootDir\": \"$relativeRootPath/\",
    \"outDir\": \"$relativeRootPath/dist\"
  },
  \"references\": []
}" >> $BASE_APP_FOLDER/$1/tsconfig.json

name=$(echo "$1" | sed -E 's/(-)([a-z])/\U\2/g; s/-//g')
echo -e "export { handler as $name } from '$relativePath/index';" >> $SRC_FOLDER/index.ts
