import { sendPictures } from './api.js';
import { resetEffect, initEffect } from './effect.js';
import { resetScale } from './scale.js';
import { showErrorMessage, showSuccessMessage } from './message.js';
import { onKeyDownEscape } from './util.js';

const MAX_HASHTAG_COUNT = 5;
const MAX_COMMENT_COUNT = 140;
const VALID_SYMBOLS = /^#[a-zа-яё0-9]{1,19}$/i;
const FILE_TYPES = ['jpg', 'jpeg', 'png'];
const ErrorText = {
  INVALID_HASHTAG_COUNT: `Максимум ${MAX_HASHTAG_COUNT} хэштегов`,
  INVALID_COMMENT_COUNT: `Комментарий не может быть длиннее ${MAX_COMMENT_COUNT} символов`,
  NOT_UNIQUE: 'Хэштеги должны быть уникальными',
  INVALID_PATTERN: 'Неправильный хэштег',
};

const SubmitButtonCaption = {
  SUBMITTING: 'Отправляю...',
  IDLE: 'Опубликовать',
};

const body = document.querySelector('body');
const form = document.querySelector('.img-upload__form');
const overlay = form.querySelector('.img-upload__overlay');
const cancelButton = form.querySelector('.img-upload__cancel');
const fileField = form.querySelector('.img-upload__input');
const hashtagField = form.querySelector('.text__hashtags');
const commentField = form.querySelector('.text__description');
const submitButton = form.querySelector('.img-upload__submit');
const photoPreview = form.querySelector('.img-upload__preview img');
const effectsPreviews = form.querySelectorAll('.effects__preview');

const pristine = new Pristine(form, {
  classTo: 'img-upload__field-wrapper',
  errorTextParent: 'img-upload__field-wrapper',
  errorTextClass: 'img-upload__field-wrapper--error',
});

const onTextChange = () => {
  submitButton.disabled = !pristine.validate();
};

const toggleSubmitButton = (isDisabled) => {
  submitButton.disabled = isDisabled;
  submitButton.textContent = SubmitButtonCaption.IDLE;
  if (isDisabled) {
    submitButton.textContent = SubmitButtonCaption.SUBMITTING;
  }
};

const showModal = () => {
  initEffect();
  overlay.classList.remove('hidden');
  body.classList.add('modal-open');
  form.addEventListener('input', onTextChange);
  cancelButton.addEventListener('click', onCancelButtonClick);
  document.addEventListener('keydown', onDocumentKeydown);
  form.addEventListener('submit', onFormSubmit);
};

const hideModal = () => {
  form.reset();
  pristine.reset();
  resetEffect();
  resetScale();
  body.classList.remove('modal-open');
  form.removeEventListener('input', onTextChange);
  cancelButton.removeEventListener('click', onCancelButtonClick);
  document.removeEventListener('keydown', onDocumentKeydown);
  form.removeEventListener('submit', onFormSubmit);
  overlay.classList.add('hidden');
};

const isTextFieldFocused = () =>
  document.activeElement === hashtagField ||
  document.activeElement === commentField;

const normalizeTags = (tagString) => tagString
  .trim()
  .split(' ')
  .filter((tag) => Boolean(tag.length));

const hasValidTags = (value) => normalizeTags(value).every((tag) => VALID_SYMBOLS.test(tag));

const hasUniqueTags = (value) => {
  const lowerCaseTags = normalizeTags(value).map((tag) => tag.toLowerCase());
  return lowerCaseTags.length === new Set(lowerCaseTags).size;
};

const hasValidHashtagCount = (value) => normalizeTags(value).length <= MAX_HASHTAG_COUNT;

const hasValidCommentCount = (value) => (value).length <= MAX_COMMENT_COUNT;

const sendForm = async (formElement) => {
  try {
    toggleSubmitButton(true);
    await sendPictures(new FormData(formElement));
    toggleSubmitButton(false);
    hideModal();
    showSuccessMessage();
  } catch {
    showErrorMessage();
    toggleSubmitButton(false);
  }
};

function onFormSubmit(evt) {
  evt.preventDefault();
  sendForm(evt.target);
}

const isErrorMessageExists = () => Boolean(document.querySelector('.error'));

function onDocumentKeydown(evt) {
  if (onKeyDownEscape(evt) && !isTextFieldFocused() && !isErrorMessageExists()) {
    evt.preventDefault();
    hideModal();
  }
}

function onCancelButtonClick() {
  hideModal();
}

const isValidType = (file) => {
  const fileName = file.name.toLowerCase();
  return FILE_TYPES.some((fileType) => fileName.endsWith(fileType));
};

const onFileInputChange = () => {
  const file = fileField.files[0];

  if (file && isValidType(file)) {
    photoPreview.src = URL.createObjectURL(file);
    effectsPreviews.forEach((preview) => {
      preview.style.backgroundImage = `url('${photoPreview.src}')`;
    });
    showModal();
  }
};

pristine.addValidator(
  hashtagField,
  hasValidTags,
  ErrorText.INVALID_PATTERN,
  1,
  true
);

pristine.addValidator(
  hashtagField,
  hasUniqueTags,
  ErrorText.NOT_UNIQUE,
  2,
  true
);

pristine.addValidator(
  hashtagField,
  hasValidHashtagCount,
  ErrorText.INVALID_HASHTAG_COUNT,
  3,
  true
);

pristine.addValidator(
  commentField,
  hasValidCommentCount,
  ErrorText.INVALID_COMMENT_COUNT,
  4,
  true
);

fileField.addEventListener('change', onFileInputChange);

