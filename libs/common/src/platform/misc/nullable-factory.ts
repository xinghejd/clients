/**
 *
 * @param c Class constructor
 * @param arg constructor argument
 * @returns instance of class or null
 */
export function nullableFactory<T extends new (arg: any) => any>(
  c: T,
  arg: ConstructorParameters<T>[0]
): InstanceType<T> | undefined {
  return arg == null ? null : new c(arg);
}
