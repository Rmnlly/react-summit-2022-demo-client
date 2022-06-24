import React, { useReducer } from "react";
import { render } from "react-dom";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  gql,
  useMutation
} from "@apollo/client";
import "./pixels.css";

// Try not to judge this code too harshly, thank you!
// const typePolicies = {
//   Pixel: {
//     keyFields: ["id", "value"]
//   }
// };
// const typePolicies = {
//   PixelImage: {
//     fields: {
//       pixelMatrix: {
//         read(pixelMatrix, { canRead }) {
//           return pixelMatrix.map((rows) => rows.filter(canRead));
//         }
//       }
//     }
//   },
//   Pixel: {
//     fields: {
//       id: {
//         read(id) {
//           return id;
//         }
//       }
//     }
//   }
// };

const client = new ApolloClient({
  uri: "https://m9ucho.sse.codesandbox.io/",
  cache: new InMemoryCache()
});

const pastryLookup = {
  BREAD: "🍞",
  CROISSANT: "🥐",
  FLATBREAD: "🫓",
  BAGUETTE: "🥖"
};

function Pixelchu() {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const { loading, error, data } = useQuery(gql`
    query ExampleQuery {
      pixelImage {
        id
        pixelMatrix {
          id
          value
        }
      }
    }
  `);

  const [mutate] = useMutation(gql`
    mutation($colour: String, $id: ID) {
      changeMainColour(colour: $colour, id: $id) {
        id
        pixelMatrix {
          id
          value
        }
      }
    }
  `);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  const updateCheekRose = (colour) => {
    client.cache.writeFragment({
      id: "Pixel:cheek",
      fragment: gql`
        fragment CheekPixel on Pixel {
          id
          value
        }
      `,
      data: {
        id: "cheek",
        value: colour
      }
    });
  };

  const extractedCache = JSON.stringify(client.cache.extract(), null, 4);

  client.cache.retain("Pixel:53ef8436-3221-4226-9850-52da543b2c4f");

  return (
    <>
      <button onClick={() => updateCheekRose("00FFFF")}>
        Make pika's cheek aqua
      </button>
      <button
        onClick={() =>
          client.cache.evict({
            id: client.cache.identify({ id: "cheek", __typename: "Pixel" })
          })
        }
      >
        Remove pikas cheek
      </button>
      <button
        onClick={() =>
          mutate({ variables: { colour: "FFA500", id: data?.pixelImage?.id } })
        }
      >
        Make pika orange
      </button>
      <button
        onClick={() =>
          mutate({ variables: { colour: "FFF000", id: data?.pixelImage?.id } })
        }
      >
        Reset Pika
      </button>
      <button
        onClick={() => {
          client.cache.gc();
          forceUpdate();
        }}
      >
        <span role="img" aria-label="broom for cache clean">
          🧹
        </span>
      </button>
      <div className="container">
        <div className="imageContainer">
          {data.pixelImage.pixelMatrix.map((rows, i) => (
            <div key={`${i}-${i}`} className="row">
              {rows.map(({ id, value }) => (
                <div
                  key={id}
                  className="pixel"
                  style={{ backgroundColor: `#${value}` }}
                ></div>
              ))}
            </div>
          ))}
        </div>
        <div className="cacheView">
          <h3>Live Cache Data</h3>
          <p>
            Cache size:
            {`${Object.keys(client.cache.extract()).length}`}
          </p>
          <pre>{`${extractedCache}`}</pre>
        </div>
      </div>
    </>
  );
}

function PastryThings() {
  const { loading, error, data } = useQuery(gql`
    query PastryArray {
      pastries {
        id
        icon
        liked
      }
      pastry(id: "croissant2") {
        icon
        liked
      }
    }
  `);

  const { loading: singleLoading, data: singlePData } = useQuery(gql`
    query PastryArray {
      pastry(id: "flatbread3") {
        id
        icon
        liked
      }
    }
  `);

  const [shufflePastries] = useMutation(gql`
    mutation sendThemShufflin {
      pastryShuffle {
        id
        icon
        liked
      }
    }
  `);

  const [likePastry] = useMutation(gql`
    mutation likePastry($id: ID) {
      likePastry(id: $id) {
        id
        icon
        liked
      }
    }
  `);

  const [addPastry, { data: addPastryData }] = useMutation(gql`
    mutation addPastry($id: ID, $liked: Boolean, $icon: PASTRY_ICON) {
      addPastry(pastryId: $id, liked: $liked, icon: $icon) {
        pastry {
          id
          liked
          icon
        }
        name
        date
      }
    }
  `);

  const [removePastry] = useMutation(gql`
    mutation removePastry($id: ID) {
      removePastry(pastryId: $id)
    }
  `);

  if (loading || singleLoading || error) return <p>load</p>;

  const extractedCache = JSON.stringify(client.cache.extract(), null, 4);

  console.log(data);

  return (
    <div>
      <button onClick={() => shufflePastries()}>Shuffle these boys</button>
      <button
        onClick={() =>
          addPastry({
            variables: { id: "bread2", liked: false, icon: "BREAD" }
          })
        }
      >
        Add a second bread
      </button>
      <button onClick={() => removePastry({ variables: { id: "bread2" } })}>
        remove the second bread
      </button>
      <div className="container">
        <div>
          {data.pastries.map((pastry, i) => (
            <p key={`${pastry.id}${i}`}>
              {pastryLookup[pastry.icon]}
              <button
                onClick={() => likePastry({ variables: { id: pastry.id } })}
              >
                {pastry.liked ? "❤️" : "💔"}
              </button>
            </p>
          ))}
          <p>My Single Pastry</p>
          <p>
            {pastryLookup[singlePData.pastry.icon]}{" "}
            {singlePData.pastry.liked ? "❤️" : "💔"}
          </p>
        </div>
        <div className="cacheView">
          <h3>Live Cache Data</h3>
          <p>
            Cache size:
            {`${Object.keys(client.cache.extract()).length}`}
          </p>
          <pre>{`${extractedCache}`}</pre>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div>
      <h2>
        Very Cool Summit Demo{" "}
        <span role="img" aria-label="little flame">
          🔥
        </span>
      </h2>
      <Pixelchu />
      {/* <PastryThings /> */}
    </div>
  );
}

render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById("root")
);
