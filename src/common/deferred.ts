export class Deferred<T> {
  readonly promise: Promise<T>;
  private resolveCallback!: (value: T | PromiseLike<T>) => void;
  private rejectCallback!: (reason?: any) => void;
  private executeCallback?: () => void;

  constructor(executor?: () => void) {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolveCallback = resolve;
      this.rejectCallback = reject;
    });
    this.executeCallback = executor;
  }

  execute(): void {
    this.executeCallback?.call(this);
  }

  resolve(data: T): void {
    this.resolveCallback(data);
  }

  reject(reason?: any): void {
    this.rejectCallback(reason);
  }
}
