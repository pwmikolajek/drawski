const CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters like 0, O, I, 1

export function generateRoomCode(length: number = 4): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    code += CHARACTERS[randomIndex];
  }
  return code;
}

export function generateUniqueRoomCode(existingCodes: Set<string>, length: number = 4): string {
  let code: string;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    code = generateRoomCode(length);
    attempts++;

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique room code');
    }
  } while (existingCodes.has(code));

  return code;
}
