// tslint:disable:no-console

export const log = (message: string, ...objs: any[]) => {
  if (console && console.log) {
    console.log(new Date(), message, ...objs);
  }
};

export const error = (message: string, ...objs: any[]) => {
  if (console && console.error) {
    console.error(new Date(), message, ...objs);
  }
};
