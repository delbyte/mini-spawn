declare module 'replicate' {
  export default class Replicate {
    constructor(options: { auth: string });
    
    run(model: string, options: { input: any }): Promise<any>;
    
    predictions: {
      create(options: { version: string; input: any }): Promise<any>;
    };
  }
}
