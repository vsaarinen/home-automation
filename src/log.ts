export const log = (message: string, ...objs: any[]) => {
  console.log(new Date(), message, ...objs); // tslint:disable-line:no-console
};

export const error = (message: string, ...objs: any[]) => {
  console.error(new Date(), message, ...objs);
};
