#!/bin/bash

set -euf -o pipefail

cd $(dirname $0)

key_name="encrypted_${ENCRYPTION_LABEL}_key"
iv_name="encrypted_${ENCRYPTION_LABEL}_iv"
key=${!key_name}
iv=${!iv_name}
openssl aes-256-cbc -K "$key" -iv "$iv" -in id_rsa.enc -out id_rsa -d
chmod 400 id_rsa
eval `ssh-agent -s`
ssh-add id_rsa

url=`git config remote.origin.url`
user=$(basename $(dirname "$url"))
project=$(basename "$url" .git)
repo="git@github.com:$user/$project-builds"
sha=`git rev-parse --verify HEAD`

git clone "$repo" deploy && cd deploy
cp ../../dist/instascan.min.js . && git add ./instascan.min.js

if [ -z "$(git diff --cached)" ]; then
  echo 'No changes to deploy.'
  exit 0
fi

git config user.name "$COMMIT_AUTHOR_NAME"
git config user.email "$COMMIT_AUTHOR_EMAIL"
git commit -a -m "Automatic build for $user/$project@${sha}."
git push "$repo" master
