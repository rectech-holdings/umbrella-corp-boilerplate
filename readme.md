# Setup

1. Ideally, Homebrew (https://brew.sh/)
1. Docker: E.g. `brew install docker --cask` and then configure the Docker app to ensure it always starts on bootup.
1. Node >= v16: E.g. `brew install node` or nvm (https://github.com/nvm-sh/nvm#installing-and-updating)
1. Enable node corepack: `corepack enable`
1. Install node deps at root: `pnpm install`
1. (Optional) Add convenience aliases: `node ./scripts/add-aliases.mjs`

# Begin Hacking

_Option 1:_ Use one of the dev alises, like `devacspa`

_Option 2:_ Do `pnpm turbo run dev --filter ac-spa...` to run the dev scripts for ac-spa and all it's dependencies

# Deployment

1. TBD...
