clean () {
  echo "Cleaning out build dir $buildDir"
  # avoid dangerously broad deletes (ie rm -rf)
  find "$buildDir" -type f -d 1 -delete
}

mkdir -p "$buildDir"
[ "$clean" = true ] && clean
