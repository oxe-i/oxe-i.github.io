const imgContainer = document.querySelector("#img-container");
const fstImg = imgContainer.querySelector("#fst-img");
const titleText = document.querySelector("#fst-title");
const descriptionText = document.querySelector("#fst-description");

const form = document.querySelector("#search-container");
const noResult = document.querySelector("#no-result");
const searchAgain = noResult.querySelector("#search-again");

const previousResult = document.querySelector("#previous-result");
const nextResult = document.querySelector("#next-result");

function createImgElement(url, width, height) {
  fstImg.src = url;
  fstImg.style.aspectRatio = width && height ? `${width / height}` : "1";
}

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;

    img.onload = () => {
      resolve(img);
    };

    img.onerror = () => {
      reject("failed to load");
    };
  });
}

async function handlePageInfo(searchKey) {
  const encodedSearchKey = encodeURIComponent(searchKey);
  const url = `https://images-api.nasa.gov/search?q=${encodedSearchKey}&media_type=image`;

  const response = await fetch(url);
  if (!response.ok) {
    noResult.showModal();
  }

  const json = await response.json();
  const items = json?.collection?.items ?? [];

  const results = items.map(async (item) => {
    const title = item?.data?.[0]?.title;
    const description = item?.data?.[0]?.description;
    const imgObj = item?.links?.find((link) => link?.rel === "alternate");
    if (title && description && imgObj) {
      const { width, height, href } = imgObj;
      try {
        return {
          loadedImg: preloadImage(href),
          width: width,
          height: height,
          title: title,
          description: description,
        };
      } catch (error) {
        return Promise.reject(error);
      }
    }
    return Promise.reject("invalid item");
  });

  return results;
}

let crtResult;
let nextResults = [];
let prevResults = [];

async function getNextResult() {
  let firstResult;
  do {
    firstResult = await Promise.race(
      nextResults.map((promise) => {
        return promise.then(
          (result) => {
            return { status: "fulfilled", result: result, promise: promise };
          },
          (error) => {
            return { status: "rejected", result: error, promise: promise };
          }
        );
      })
    );
    const index = nextResults.indexOf(firstResult.promise);
    nextResults.splice(index, 1);
  } while (firstResult?.status !== "fulfilled" && nextResults.length);

  if (firstResult?.status !== "fulfilled") return;

  const prevResult = crtResult;
  crtResult = firstResult;
  const result = crtResult.result;

  await result.loadedImg.then(
    (img) => {
      if (prevResult) {
        prevResults.push({
          promise: prevResult.promise,
          result: prevResult.result,
        });
      }
      createImgElement(img.src, result.width, result.height);
      titleText.textContent = result.title;
      descriptionText.textContent = result.description;
    },
    () => {
      getNextResult();
    }
  );
}

async function getPrevResult() {
  const firstResult = prevResults.pop();

  if (firstResult === undefined) return;

  const nextResult = crtResult;
  crtResult = firstResult;
  const result = crtResult.result;

  await result.loadedImg.then(
    (img) => {
      if (nextResult) {
        nextResults.unshift(nextResult.promise);
      }      
      createImgElement(img.src, result.width, result.height);
      titleText.textContent = result.title;
      descriptionText.textContent = result.description;
    },
    () => {
      getPrevResult();
    }
  );
}

async function getResultsAndShow(searchKey) {
  try {
    nextResults = await handlePageInfo(searchKey);
    getNextResult();
    document.documentElement.style.setProperty("--display-result", "block");
  } catch (error) {
    console.log(error);
    noResult.showModal();
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const searchKey = new FormData(form).get("search-bar");
  getResultsAndShow(searchKey);
});

searchAgain.addEventListener("click", () => {
  noResult.close();
});

async function initialInfo() {
  getResultsAndShow("Andromeda");
}

nextResult.addEventListener("click", () => {
  getNextResult();
});

previousResult.addEventListener("click", () => {
  getPrevResult();
});

document.addEventListener("DOMContentLoaded", initialInfo);
