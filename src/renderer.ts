import './index.css';

type Note = {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
};

const STORAGE_KEY = 'desktop-notes';

const addNoteButton = document.querySelector<HTMLButtonElement>('#add-note');
const deleteNoteButton = document.querySelector<HTMLButtonElement>('#delete-note');
const noteList = document.querySelector<HTMLUListElement>('#note-list');
const noteTitleInput = document.querySelector<HTMLInputElement>('#note-title');
const noteBodyInput = document.querySelector<HTMLTextAreaElement>('#note-body');
const noteUpdatedLabel = document.querySelector<HTMLParagraphElement>(
  '#note-updated',
);
const emptyState = document.querySelector<HTMLDivElement>('#empty-state');

let notes: Note[] = [];
let activeNoteId: string | null = null;

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const loadNotes = () => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    notes = [];
    return;
  }

  try {
    const parsed = JSON.parse(stored) as Note[];
    notes = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load notes', error);
    notes = [];
  }
};

const persistNotes = () => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

const setEditorState = (enabled: boolean) => {
  if (!noteTitleInput || !noteBodyInput || !deleteNoteButton) {
    return;
  }
  noteTitleInput.disabled = !enabled;
  noteBodyInput.disabled = !enabled;
  deleteNoteButton.disabled = !enabled;
};

const renderNotes = () => {
  if (!noteList) {
    return;
  }
  noteList.innerHTML = '';

  notes
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .forEach((note) => {
      const listItem = document.createElement('li');
      listItem.className = `note-card${note.id === activeNoteId ? ' active' : ''}`;
      listItem.dataset.noteId = note.id;

      const title = document.createElement('p');
      title.className = 'note-card__title';
      title.textContent = note.title || 'Ghi chú mới';

      const preview = document.createElement('p');
      preview.className = 'note-card__preview';
      preview.textContent = note.body ? note.body.slice(0, 80) : 'Chưa có nội dung';

      listItem.append(title, preview);
      listItem.addEventListener('click', () => selectNote(note.id));

      noteList.appendChild(listItem);
    });

  if (emptyState) {
    emptyState.classList.toggle('visible', notes.length === 0);
  }
};

const updateEditorFields = (note: Note | null) => {
  if (!noteTitleInput || !noteBodyInput || !noteUpdatedLabel) {
    return;
  }

  if (!note) {
    noteTitleInput.value = '';
    noteBodyInput.value = '';
    noteUpdatedLabel.textContent = 'Chọn ghi chú để chỉnh sửa';
    setEditorState(false);
    return;
  }

  noteTitleInput.value = note.title;
  noteBodyInput.value = note.body;
  noteUpdatedLabel.textContent = `Cập nhật lần cuối: ${formatDate(note.updatedAt)}`;
  setEditorState(true);
};

const selectNote = (noteId: string | null) => {
  activeNoteId = noteId;
  const activeNote = notes.find((note) => note.id === noteId) ?? null;
  updateEditorFields(activeNote);
  renderNotes();
};

const createNote = () => {
  const newNote: Note = {
    id: crypto.randomUUID(),
    title: '',
    body: '',
    updatedAt: Date.now(),
  };

  notes.unshift(newNote);
  persistNotes();
  selectNote(newNote.id);
};

const deleteNote = () => {
  if (!activeNoteId) {
    return;
  }

  notes = notes.filter((note) => note.id !== activeNoteId);
  persistNotes();
  selectNote(notes[0]?.id ?? null);
};

const updateActiveNote = () => {
  if (!activeNoteId || !noteTitleInput || !noteBodyInput) {
    return;
  }

  const noteIndex = notes.findIndex((note) => note.id === activeNoteId);
  if (noteIndex === -1) {
    return;
  }

  notes[noteIndex] = {
    ...notes[noteIndex],
    title: noteTitleInput.value.trimStart(),
    body: noteBodyInput.value.trimStart(),
    updatedAt: Date.now(),
  };

  persistNotes();
  renderNotes();
  updateEditorFields(notes[noteIndex]);
};

addNoteButton?.addEventListener('click', createNote);

deleteNoteButton?.addEventListener('click', deleteNote);

noteTitleInput?.addEventListener('input', updateActiveNote);

noteBodyInput?.addEventListener('input', updateActiveNote);

loadNotes();
selectNote(notes[0]?.id ?? null);
renderNotes();
