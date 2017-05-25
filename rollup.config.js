import babel from 'rollup-plugin-babel'

export default {
  external: [
    'mongodb',
    'bson',
    'js-data',
    'js-data-adapter',
    'mout/string/underscore'
  ],
  plugins: [
    babel({
      babelrc: false,
      plugins: [
        'external-helpers'
      ],
      presets: [
        [
          'es2015',
          {
            modules: false
          }
        ]
      ],
      exclude: 'node_modules/**'
    })
  ]
}
