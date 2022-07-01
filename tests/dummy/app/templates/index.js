// export default class IndexTemplate {
//   static create() {
//     return new this();
//   }

//   constructor() {
    // debugger;
//   }
// }

export default function indexTemplate(owner) {
  return {
    get moduleName() {
      // debugger
    },
    get id() {
      // debugger
    },
    get referrer() {
      // debugger
    },
    get layout() {
      // debugger;
    },
    get parsedLayout() {
      return {
        id: 'plxh',
        moduleName: 'dummy/templates/index.hbs',
        owner,
        scope: {
          me: 'foo',
        }
      }
    },
    result: 'ok',
    asLayout() {
      // debugger
    },
    asWrappedLayout() {
      // debugger
    },
  };
}
