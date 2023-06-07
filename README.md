![Screenshot of markojs.com running in a browser](https://user-images.githubusercontent.com/1958812/62652399-2a314c80-b910-11e9-883b-196686708979.png)

## Running markojs.com Locally

``` bash
git clone https://github.com/marko-js/website.git
cd website
git submodule update --init --recursive
npm install
npm run dev
```

## Serving a static build

```bash
npm run build
npx http-server ./build
```

## Publishing

```bash
npm run publish
```

## Contributing

Pull Requests greatly appreciated!
