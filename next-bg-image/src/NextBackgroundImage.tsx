"use client";

import React, { useEffect, useId, useState } from "react";
import type { StaticImageData } from "next/image";
import getImageData, { generateMediaQuery, lazyCss } from "./lib";
import "./next-bg-image.css";
import { useIntersectionObserver } from "./hooks";

interface Props {
  src: StaticImageData | Array<StaticImageData | string>;
  children: React.ReactNode;
  lazyLoad?: boolean;
  lazyThreshold?: number | string;
  size?: "cover" | "contain" | "full"; // TODO: add custom stuff
  position?: "center" | "top" | "bottom" | "left" | "right"; // TODO: add custom stuff
  className?: string;
}

const NextBackgroundImage: React.FC<Props> = ({
  src: srcProp,
  children,
  className,
  lazyLoad = false,
  lazyThreshold = 500,
  size = `cover`,
  position = `center`,
}) => {
  const src = Array.isArray(srcProp) ? srcProp : [srcProp];

  const id = useId().replace(/:/g, ``);
  /* const imageProps = unstable_getImgProps({ */
  /*   src, */
  /*   alt: ``, */
  /*   sizes: `hello`, */
  /*   width: src.width, */
  /*   height: src.height, */
  /*   placeholder: `blur`, */
  /* }); */
  const { decls, blurry } = getImageData(src, lazyLoad);

  const { intersected, ref } = useIntersectionObserver(lazyLoad, {
    rootMargin:
      typeof lazyThreshold === `string` ? lazyThreshold : `${lazyThreshold}px`,
    threshold: 0,
  });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [initialWindowWidth, setInitialWindowWidth] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (intersected) {
      const imgs = decls
        .find(
          (decl) =>
            decl.min <= window.innerWidth && decl.max >= window.innerWidth,
        )
        ?.images.filter(
          (img): img is { type: "url"; value: string } => img.type === `url`,
        );
      if (imgs) {
        const promise: Promise<unknown[]> = Promise.all(
          imgs.map(
            (data) =>
              new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(undefined);
                img.onerror = () => resolve(undefined);
                img.src = data.value;
              }),
          ),
        );
        promise.then(() => setImageLoaded(true));
      }
    }
  }, [intersected, decls]);

  useEffect(() => {
    setInitialWindowWidth(window.innerWidth);
  }, []);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html:
            decls
              .reverse()
              .map((decl) =>
                generateMediaQuery(decl, id, lazyLoad, initialWindowWidth),
              )
              .join(`\n`) + lazyCss(blurry, id, position, size),
        }}
      />
      <div
        ref={ref}
        id={id}
        style={{
          backgroundSize: size,
          backgroundPosition: position,
          position: `relative`,
        }}
        className={`next_bg_image__container ${
          imageLoaded ? `loaded` : ``
        } ${className}`}
      >
        {String(intersected)}
        {children}
      </div>
    </>
  );
};

export default NextBackgroundImage;