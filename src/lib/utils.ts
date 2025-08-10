type ClassArg = string | number | false | null | undefined | ClassArg[]

function flattenClasses(args: ClassArg[], out: string[] = []): string[] {
  for (const arg of args) {
    if (!arg) continue
    if (Array.isArray(arg)) {
      flattenClasses(arg, out)
    } else {
      out.push(String(arg))
    }
  }
  return out
}

export function cn(...inputs: ClassArg[]): string {
  return flattenClasses(inputs).join(' ')
}


