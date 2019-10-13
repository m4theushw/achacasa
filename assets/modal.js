class Modal {
  constructor(element) {
    this.isOpen = false;
    this.element = element;

    const close = this.element.querySelector('.modal-close');
    close.addEventListener('click', this.close);

    const dialog = this.element.querySelector('.modal-dialog');
    this.element.addEventListener('click', e => {
      if (this.isOpen && !dialog.contains(e.target)) {
        this.close();
      }
    });
  }

  show = () => {
    this.isOpen = true;
    this.showBackdrop();
    this.showModal();
  };

  close = () => {
    this.isOpen = false;
    this.hideBackdrop();
    this.hideModal();
  };

  showModal = () => {
    this.element.style.display = 'block';

    setTimeout(() => {
      this.element.classList.add('modal-show');
    }, 0);
  };

  hideModal = () => {
    this.element.classList.remove('modal-show');

    setTimeout(() => {
      this.element.style.display = 'none';
    }, 200);
  };

  showBackdrop = () => {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);

    setTimeout(() => {
      backdrop.classList.add('modal-backdrop-show');
    }, 200);
  };

  hideBackdrop = () => {
    const backdrop = document.body.querySelector('.modal-backdrop');
    document.body.removeChild(backdrop);
  };
}

export default Modal;
