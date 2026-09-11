// GSAP Scroll Animations — Reveals, parallax aur interactions

document.addEventListener("DOMContentLoaded", () => {
  // Plugins register karo
  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  // Desktop smooth scroll (Lenis)
  mm.add("(min-width: 768px)", () => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  });

  // Navbar scroll background change
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    ScrollTrigger.create({
      start: "top -80",
      onUpdate: (self) => {
        if (self.direction === 1 && self.scroll() > 80) {
          navbar.classList.add("scrolled");
        } else if (self.scroll() < 80) {
          navbar.classList.remove("scrolled");
        }
      },
    });
  }

  // Word-by-word text animation
  document.querySelectorAll(".word-reveal").forEach((el) => {
    const text = el.textContent.trim();
    el.innerHTML = "";
    text.split(/\s+/).forEach((word) => {
      const wrapper = document.createElement("span");
      wrapper.className = "word";
      const inner = document.createElement("span");
      inner.textContent = word;
      wrapper.appendChild(inner);
      el.appendChild(wrapper);
    });

    const words = el.querySelectorAll(".word span");
    gsap.fromTo(
      words,
      { y: "110%", opacity: 0 },
      {
        y: "0%",
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.04,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      },
    );
  });

  // Hero title typewriter reveal
  document.querySelectorAll(".hero-title-reveal").forEach((el) => {
    const text = el.textContent.trim();

    if (window.innerWidth < 768) {
      el.classList.add("word-reveal");
      return;
    }

    el.innerHTML = "";

    text.split(" ").forEach((word, index, arr) => {
      const wordSpan = document.createElement("span");
      wordSpan.style.display = "inline-block";
      wordSpan.style.whiteSpace = "nowrap";

      word.split("").forEach((char) => {
        const charSpan = document.createElement("span");
        charSpan.textContent = char;
        charSpan.style.opacity = "0";
        charSpan.style.display = "inline-block";
        charSpan.classList.add("hero-char");
        wordSpan.appendChild(charSpan);
      });

      el.appendChild(wordSpan);

      if (index < arr.length - 1) {
        const space = document.createElement("span");
        space.innerHTML = "&nbsp;";
        el.appendChild(space);
      }
    });

    const chars = el.querySelectorAll(".hero-char");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });

    tl.to(chars, {
      opacity: 1,
      duration: 0.02,
      stagger: 0.06,
      ease: "none",
    });
  });

  // Fade up animation
  gsap.utils.toArray(".reveal").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
        onComplete: () => {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        },
      },
    );
  });

  // Left se slide
  gsap.utils.toArray(".reveal-left").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, x: -60 },
      {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        onComplete: () => {
          el.style.opacity = "1";
          el.style.transform = "translateX(0)";
        },
      },
    );
  });

  // Right se slide
  gsap.utils.toArray(".reveal-right").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, x: 60 },
      {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        onComplete: () => {
          el.style.opacity = "1";
          el.style.transform = "translateX(0)";
        },
      },
    );
  });

  // Scale up animation
  gsap.utils.toArray(".reveal-scale").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.92 },
      {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        onComplete: () => {
          el.style.opacity = "1";
          el.style.transform = "scale(1)";
        },
      },
    );
  });

  // Stagger children reveal
  gsap.utils.toArray(".stagger-children").forEach((parent) => {
    const children = parent.children;
    gsap.fromTo(
      children,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.2,
        scrollTrigger: {
          trigger: parent,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        onComplete: function () {
          Array.from(children).forEach((child) => {
            child.style.opacity = "1";
            child.style.transform = "translateY(0)";
          });
        },
      },
    );
  });

  // Services horizontal track animation
  const servicesSection = document.querySelector(".services-section");
  const servicesTrack = document.querySelector(".services-track");
  if (servicesSection && servicesTrack) {
    const getScrollAmount = () => {
      return -(servicesTrack.scrollWidth - window.innerWidth);
    };

    const servicesTween = gsap.to(servicesTrack, {
      x: getScrollAmount,
      ease: "none",
      scrollTrigger: {
        trigger: ".services-track-wrapper",
        start: "top top",
        end: () => `+=${servicesTrack.scrollWidth - window.innerWidth}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });

    gsap.utils.toArray(".service-track-card").forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            containerAnimation: servicesTween,
            start: "left 85%",
            toggleActions: "play none none none",
          },
          onComplete: () => {
            card.style.opacity = "1";
            card.style.transform = "";
          },
        },
      );
    });
  }

  // Parallax images
  gsap.utils.toArray(".parallax-img").forEach((img) => {
    const speed = img.dataset.speed || -50;
    gsap.to(img, {
      y: speed,
      ease: "none",
      scrollTrigger: {
        trigger: img,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });
  });

  // Hero floating images
  gsap.utils.toArray(".hero-img").forEach((img, i) => {
    gsap.to(img, {
      y: `${-20 - i * 10}`,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1.5,
      },
    });

    let startX = 0,
      startY = 80;
    if (i === 0) {
      startX = -100;
      startY = -100;
    } else if (i === 1) {
      startX = 100;
      startY = -80;
    } else if (i === 2) {
      startX = 0;
      startY = 150;
    }

    gsap.fromTo(
      img,
      { opacity: 0, x: startX, y: startY, scale: 0.85 },
      {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 1.5,
        delay: 0.4 + i * 0.2,
        ease: "power4.out",
      },
    );
  });

  // Gallery items stagger
  const galleryItems = gsap.utils.toArray(".gallery-item");
  if (galleryItems.length) {
    gsap.fromTo(
      galleryItems,
      { opacity: 0, y: 60, scale: 0.95 },
      {
        opacity: 1,
        y: (i) => (i % 3 === 1 ? 48 : 0),
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: ".gallery-grid",
          start: "top 80%",
          toggleActions: "play none none none",
        },
      },
    );
  }

  // Stats number counter
  gsap.utils.toArray(".stat-number").forEach((stat) => {
    const target = stat.textContent.trim();
    const match = target.match(/^([\d,]+)(.*)$/);
    if (match) {
      const num = parseInt(match[1].replace(/,/g, ""));
      const suffix = match[2];
      stat.textContent = "0" + suffix;

      ScrollTrigger.create({
        trigger: stat,
        start: "top 90%",
        once: true,
        onEnter: () => {
          gsap.to(
            { val: 0 },
            {
              val: num,
              duration: 2,
              ease: "power2.out",
              onUpdate: function () {
                stat.textContent = Math.floor(this.targets()[0].val) + suffix;
              },
            },
          );
        },
      });
    }
  });

  // Service card image parallax
  gsap.utils.toArray(".service-img").forEach((img) => {
    gsap.to(img.querySelector("img"), {
      y: -30,
      ease: "none",
      scrollTrigger: {
        trigger: img,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.5,
      },
    });
  });

  // Divider line draw
  gsap.utils.toArray(".divider").forEach((div) => {
    gsap.fromTo(
      div,
      { scaleX: 0, transformOrigin: "left center" },
      {
        scaleX: 1,
        duration: 1,
        ease: "power3.inOut",
        scrollTrigger: {
          trigger: div,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      },
    );
  });

  // CTA section animation
  const ctaSection = document.querySelector(".cta-section");
  if (ctaSection) {
    const ctaChildren = ctaSection.querySelectorAll(
      ".reveal, .display-lg, .subtitle, .btn",
    );
    gsap.fromTo(
      ctaChildren,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: ctaSection,
          start: "top 75%",
          toggleActions: "play none none none",
        },
      },
    );
  }

  // Mobile menu toggle
  const mobileToggle = document.querySelector(".mobile-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener("click", () => {
      mobileToggle.classList.toggle("active");
      mobileMenu.classList.toggle("active");
      document.body.style.overflow = mobileMenu.classList.contains("active")
        ? "hidden"
        : "";
    });

    mobileMenu.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        mobileToggle.classList.remove("active");
        mobileMenu.classList.remove("active");
        document.body.style.overflow = "";
      });
    });
  }

  // Form input focus effect
  document
    .querySelectorAll(".form-input, .form-textarea, .form-select")
    .forEach((input) => {
      input.addEventListener("focus", () => {
        input.parentElement.classList.add("focused");
      });
      input.addEventListener("blur", () => {
        input.parentElement.classList.remove("focused");
      });
    });

  // Preloader logic
  const initPreloader = () => {
    const preloader = document.getElementById("preloader");
    const progressBar = document.getElementById("progress-bar");
    const percentText = document.getElementById("preloader-percent");
    if (!preloader || !progressBar || !percentText) return;

    if (window.innerWidth < 768) {
      preloader.style.display = "none";
      const heroTitle = document.querySelector(".hero-title-reveal");
      if (heroTitle) heroTitle.classList.add("active");
      return;
    }

    let is3DLoaded = false;
    let isAnimationFinished = false;

    window.addEventListener("featherLoaded", () => {
      is3DLoaded = true;
      checkFinished();
    });

    const checkFinished = () => {
      if (is3DLoaded && isAnimationFinished) {
        gsap.to(preloader, {
          yPercent: -100,
          duration: 0.8,
          ease: "power4.inOut",
          onComplete: () => preloader.remove(),
        });

        const heroTitle = document.querySelector(".hero-title-reveal");
        if (heroTitle) heroTitle.classList.add("active");
      }
    };

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimationFinished = true;
        checkFinished();
      },
    });

    tl.to(progressBar, {
      strokeDashoffset: 0,
      duration: 0.45,
      ease: "power2.inOut",
      onUpdate: function () {
        const progress = Math.round(this.progress() * 100);
        percentText.textContent = `${progress}%`;
      },
    });

    // 1s timeout backup
    setTimeout(() => {
      const el = document.getElementById("preloader");
      if (el) {
        percentText.textContent = "100%";
        is3DLoaded = true;
        isAnimationFinished = true;
        checkFinished();
      }
    }, 1000);
  };

  initPreloader();

  // Footer glow parallax effect
  const footer = document.querySelector(".footer");
  if (footer) {
    let mouseX = 0;
    let mouseY = 0;
    let glowX = 0;
    let glowY = 0;

    document.addEventListener("mousemove", (e) => {
      mouseX = (e.clientX / window.innerWidth) * 100;
      mouseY = (e.clientY / window.innerHeight) * 100;
    });

    gsap.to(
      {},
      {
        duration: 0.1,
        repeat: -1,
        onUpdate: function () {
          glowX += (mouseX - glowX) * 0.08;
          glowY += (mouseY - glowY) * 0.08;

          gsap.set(footer, {
            "--glow-x": `${glowX * 0.3 - 100}px`,
            "--glow-y": `${glowY * 0.2 - 150}px`,
          });
        },
      },
    );

    window.addEventListener("scroll", () => {
      const scrollProgress =
        window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight);
      gsap.set(footer, {
        "--scroll-glow": `${scrollProgress * 50}px`,
      });
    });
  }
});
