
type AnimationOptions = {
  duration?: number;
  delay?: number;
  easing?: string;
};

export const fadeIn = (
  element: HTMLElement,
  options: AnimationOptions = {}
): Promise<void> => {
  const { duration = 300, delay = 0, easing = 'ease-in-out' } = options;
  
  element.style.opacity = '0';
  element.style.transition = `opacity ${duration}ms ${easing} ${delay}ms`;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      element.style.opacity = '1';
      setTimeout(resolve, duration + delay);
    }, 10);
  });
};

export const fadeOut = (
  element: HTMLElement, 
  options: AnimationOptions = {}
): Promise<void> => {
  const { duration = 300, delay = 0, easing = 'ease-in-out' } = options;
  
  element.style.opacity = '1';
  element.style.transition = `opacity ${duration}ms ${easing} ${delay}ms`;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      element.style.opacity = '0';
      setTimeout(resolve, duration + delay);
    }, 10);
  });
};

export const slideUp = (
  element: HTMLElement, 
  options: AnimationOptions = {}
): Promise<void> => {
  const { duration = 400, delay = 0, easing = 'ease-out' } = options;
  
  element.style.transform = 'translateY(10px)';
  element.style.opacity = '0';
  element.style.transition = `
    transform ${duration}ms ${easing} ${delay}ms,
    opacity ${duration}ms ${easing} ${delay}ms
  `;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      element.style.transform = 'translateY(0)';
      element.style.opacity = '1';
      setTimeout(resolve, duration + delay);
    }, 10);
  });
};

export const slideDown = (
  element: HTMLElement, 
  options: AnimationOptions = {}
): Promise<void> => {
  const { duration = 400, delay = 0, easing = 'ease-out' } = options;
  
  element.style.transform = 'translateY(-10px)';
  element.style.opacity = '0';
  element.style.transition = `
    transform ${duration}ms ${easing} ${delay}ms,
    opacity ${duration}ms ${easing} ${delay}ms
  `;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      element.style.transform = 'translateY(0)';
      element.style.opacity = '1';
      setTimeout(resolve, duration + delay);
    }, 10);
  });
};

export const staggerChildren = (
  parent: HTMLElement,
  childSelector: string,
  animationFn: (el: HTMLElement, opt: AnimationOptions) => Promise<void>,
  options: AnimationOptions & { staggerDelay?: number } = {}
): Promise<void> => {
  const { staggerDelay = 50, ...animationOptions } = options;
  const children = Array.from(parent.querySelectorAll(childSelector)) as HTMLElement[];
  
  const promises = children.map((child, index) => {
    const delay = (options.delay || 0) + (index * staggerDelay);
    return animationFn(child, { ...animationOptions, delay });
  });
  
  return Promise.all(promises).then(() => {});
};
