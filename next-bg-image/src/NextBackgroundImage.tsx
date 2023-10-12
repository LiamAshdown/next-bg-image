"use client";

import React, { useEffect, useId, useState } from "react";
import { unstable_getImgProps } from "next/image";
import type { StaticImageData } from "next/image";
import getImageData, { generateMediaQuery, lazyCss } from "./lib";
import "./next-bg-image.css";
import { useIntersectionObserver } from "./hooks";

interface Props {
  src: StaticImageData;
  children: React.ReactNode;
  lazyLoad?: boolean;
  size?: "cover" | "contain" | "full"; // TODO: add custom stuff
  position?: "center" | "top" | "bottom" | "left" | "right"; // TODO: add custom stuff
  className?: string;
}

const NextBackgroundImage: React.FC<Props> = ({
  src,
  children,
  className,
  lazyLoad = false,
  size = `cover`,
  position = `center`,
}) => {
  const id = useId().replace(/:/g, ``);
  const imageProps = unstable_getImgProps({
    src,
    alt: ``,
    sizes: `hello`,
    width: src.width,
    height: src.height,
    placeholder: `blur`,
  });
  const { decls, blurry } = getImageData(
    imageProps.props.srcSet || ``,
    src.width,
    src.src,
    lazyLoad,
  );
  /*
   *  next two steps that seem obvious to jared:
   *   1. tweak props for customizable rootMargin
   *   2. the beefier task: don't unblur until image is fully loaded
   *
   * */
  const { intersected, ref } = useIntersectionObserver(lazyLoad, {
    rootMargin: `500px`,
    threshold: 0,
  });

  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (intersected) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(true);
      const url = decls.find(
        (decl) =>
          decl.min <= window.innerWidth && decl.max >= window.innerWidth,
      )?.url;
      if (url) {
        img.src = url;
      }
    }
  }, [intersected, decls]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html:
            decls
              .map((decl) => generateMediaQuery(decl, id, lazyLoad))
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
          // border: `8px solid red`,
        }}
        className={`next_bg_image__container ${
          imageLoaded && `loaded`
        } ${className}`}
      >
        {String(intersected)}
        {children}
      </div>
    </>
  );
};

export default NextBackgroundImage;
