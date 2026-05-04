const arrayNames = ["Neon", "Cyber", "Void", "Pixel", "Rust"];

export function generateName() {
    const randomName =
        arrayNames[Math.floor(Math.random() * arrayNames.length)];
    const randomNumber = Math.floor(Math.random() * 1000);

    return `${randomName}${randomNumber}`;
}