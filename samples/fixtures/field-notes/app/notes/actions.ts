'use server';
export async function saveNote(formData: FormData) {
  return { saved: formData.get('noteId') };
}
