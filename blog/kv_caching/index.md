# Key–Value Caching

In standard attention, for an input sequence with ( n ) tokens,

[
 x = [x_1, x_2, \dots, x_n]
]

we compute **query**, **key**, and **value** projections.

The query projection for each token ( x_i ) can be represented as ( q_i ), where:

[
 q_i \in \mathbb{R}^{1 \times d}
]

Here, ( d ) is the model dimension.

For the full sequence:

[
 q = \langle q_1, q_2, \dots, q_n \rangle
]

where ( \langle \cdot \rangle ) denotes concatenation.
Similarly,

[
 k = \langle k_1, k_2, \dots, k_n \rangle, \quad
 v = \langle v_1, v_2, \dots, v_n \rangle
]

For now, let’s work only with **self-attention**. We will build up to multi-head attention later.

---

## Attention Computation

To compute attention scores, we take the dot product between ( q ) and ( k ), and scale it by a factor of ( \frac{1}{\sqrt{d}} ):

[
 \text{attention_scores}
 = \frac{q \cdot k^\top}{\sqrt{d}}
]

* **Time Complexity:** ( O(d \cdot n^2) )
* **Space Complexity:** ( O(n^2) )

We then apply **causal masking** and **softmax** to generate normalized scores:

[
 \text{attention_scores}_{\text{norm}}
 = \text{softmax}(\text{causal_mask}(\text{attention_scores}))
 = g(\text{attention_scores})
]

Finally, scaled dot-product attention (self-attention) is computed as:

[
 \text{output}
 = \text{attention_scores}_{\text{norm}} \cdot v
]

So far, everything is standard.

---

## Autoregressive Generation

Since this is an autoregressive task, the model predicts the **next token**.

Given an input sequence of ( n ) tokens, we generate the ( (n+1) )-th token:

[
 x_{n+1} = M(x) = M([x_1, x_2, \dots, x_n])
]

To keep generating further tokens, we feed the output back into the model:

[
 x_{n+2} = M([x_1, x_2, \dots, x_n, x_{n+1}])
]

and so on.

---

## Recomputing Projections

To generate the ( (n+2) )-th token, we again compute query, key, and value projections:

[
 q' = \langle q_1, q_2, \dots, q_n, q_{n+1} \rangle
]

[
 k' = \langle k_1, k_2, \dots, k_n, k_{n+1} \rangle
]

[
 v' = \langle v_1, v_2, \dots, v_n, v_{n+1} \rangle
]

We then recompute self-attention using these projections.

First, we compute attention scores:

[
 q' \cdot k'^{\top}
]

But in doing so, **most of the computations are repeated**. Only the computations involving the new token differ.

---

## Identifying Overlapping Computation

Let’s assume a cache (for simplicity) as a Python-like structure:

```
cache = []
```

If you look closely at the attention score matrix:

* Only the **last row** and **last column** are new
* The remaining ( n \times n ) block is exactly the same as before

The last row is computed as:

[
 q_{n+1} \cdot k'^{\top} \in \mathbb{R}^{1 \times (n+1)}
]

The last column (except the last overlapping element) is computed as:

[
 q \cdot k_{n+1}^{\top} \in \mathbb{R}^{n \times 1}
]

To compute the new attention score matrix, we might consider storing:

* Old attention scores ( (q \cdot k^{\top}) ) — the overlapping ( n \times n ) block
* Key projections — needed to compute the last row
* Query projections — needed to compute the last column

So the cache looks like:

```text
cache = [
  attention_scores,
  key_proj,
  query_proj
]
```

---

## Effect of Causal Masking

When we apply causal masking, we ignore the **upper triangle** (above the main diagonal).

After applying the causal mask, we ultimately **ignore the last column**.

So even if the last column is not computed, **it is totally fine**.

This means caching query projections is not required at all.

The cache now becomes:

```text
cache = [
  attention_scores,
  key_proj
]
```

---

## Incorporating Value Projections

Next, to compute the final attention output, we multiply the normalized attention scores with the value projection:

[
 g(\text{new_attention_scores}) \cdot v'
 = g(\text{new_attention_scores}) \cdot \langle v, v_{n+1} \rangle
]

Because of causal masking:

* The first ( n ) rows of the final attention output remain the same
* The only new computation is the **last row**

The ( (n+1) )-th row is computed as:

[
 \text{attn_scores}_{n+1} \cdot v'
]

This shows that **value projections are also important** and must be cached.

So now the cache becomes:

```text
cache = [
  attention_scores,
  key_proj,
  value_proj
]
```

---

## Final Observation

One key detail here:

To generate the ( (n+2) )-th token, we **do not need the first ( n ) rows** of the final attention output.

All the information required — the attention of all previous tokens on the ( (n+1) )-th token — is embedded in the **last row**.

This means we do **not** need to cache attention scores either.

---

## Final Cache: KV Cache

So finally, the cache contains **only**:

```text
cache = [
  key_proj,
  value_proj
]
```

And that is **Key–Value (KV) Caching**.
