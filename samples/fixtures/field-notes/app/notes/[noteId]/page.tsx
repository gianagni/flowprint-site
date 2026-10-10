import { getNote } from '../../../lib/notes';
import { saveNote } from '../actions';
export default async function NotePage({ params }: { params: { noteId: string } }) {
  const note = await getNote(params.noteId);
  return <form action={saveNote}><h1>{note.title}</h1></form>;
}
